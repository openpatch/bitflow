import {
  bitflowError,
  toDiagnostics,
  type Result,
} from "./errors";
import {
  conditionContext,
  getNode,
  isTerminalNode,
  nextNodeId,
  previousNodeId,
  scoreOf,
  startNodeId,
} from "./engine";
import { createId } from "./id";
import { getBit } from "./registry";
import {
  ATTEMPT_SCHEMA_VERSION,
  AttemptSnapshotSchema,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitNode,
  type BitResult,
  type Confidence,
} from "./schema";

const nowIso = (now?: Date): string => (now ?? new Date()).toISOString();

/**
 * Every mutation goes through here so `updatedAt` can never drift out of step
 * with the change that caused it.
 */
const touch = (
  snapshot: AttemptSnapshot,
  patch: Partial<AttemptSnapshot>,
  now?: Date,
): AttemptSnapshot => ({ ...snapshot, ...patch, updatedAt: nowIso(now) });

// --- lifecycle --------------------------------------------------------------

export const createAttempt = (
  doc: BitflowDocument,
  options: { attemptId?: string; now?: Date } = {},
): Result<AttemptSnapshot> => {
  const first = startNodeId(doc);
  if (!first) {
    return {
      ok: false,
      error: bitflowError("INVALID_FLOW", "The flow has no nodes to start at."),
    };
  }

  const timestamp = nowIso(options.now);
  return {
    ok: true,
    value: {
      schemaVersion: ATTEMPT_SCHEMA_VERSION,
      flowId: doc.meta.id,
      flowSchemaVersion: doc.version,
      attemptId: options.attemptId ?? createId("attempt"),
      status: "inProgress",
      currentNodeId: first,
      history: [first],
      answers: {},
      results: {},
      tries: {},
      elapsedMs: {},
      startedAt: timestamp,
      updatedAt: timestamp,
      enteredAt: timestamp,
    },
  };
};

/**
 * Validates a snapshot from the host against the document it claims to belong
 * to. Callers must treat a failure as "keep the current attempt untouched" —
 * a half-restored attempt would silently lose a learner's work.
 */
export const restoreAttempt = (
  doc: BitflowDocument,
  input: unknown,
): Result<AttemptSnapshot> => {
  const value = typeof input === "string" ? safeParseJson(input) : input;
  if (value === undefined) {
    return {
      ok: false,
      error: bitflowError("INVALID_ATTEMPT", "The attempt is not valid JSON."),
    };
  }

  const parsed = AttemptSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_ATTEMPT",
        "The attempt does not match the attempt snapshot schema.",
        toDiagnostics(parsed.error.issues),
      ),
    };
  }

  const snapshot = parsed.data;
  if (snapshot.flowId !== doc.meta.id) {
    return {
      ok: false,
      error: bitflowError(
        "FLOW_ATTEMPT_MISMATCH",
        `The attempt belongs to flow "${snapshot.flowId}" but the loaded flow is "${doc.meta.id}".`,
      ),
    };
  }
  if (snapshot.flowSchemaVersion !== doc.version) {
    return {
      ok: false,
      error: bitflowError(
        "FLOW_ATTEMPT_MISMATCH",
        `The attempt was recorded against flow schema version ${snapshot.flowSchemaVersion}, but the flow is version ${doc.version}.`,
      ),
    };
  }
  if (!getNode(doc, snapshot.currentNodeId)) {
    return {
      ok: false,
      error: bitflowError(
        "FLOW_ATTEMPT_MISMATCH",
        `The attempt stops at node "${snapshot.currentNodeId}", which the flow does not contain.`,
      ),
    };
  }

  return { ok: true, value: snapshot };
};

const safeParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const abandonAttempt = (
  snapshot: AttemptSnapshot,
  now?: Date,
): AttemptSnapshot => touch(snapshot, { status: "abandoned" }, now);

// --- answering --------------------------------------------------------------

/** A durable answer change, without evaluating it. */
export const setAnswer = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  answer: unknown,
  now?: Date,
): AttemptSnapshot =>
  touch(snapshot, { answers: { ...snapshot.answers, [nodeId]: answer } }, now);

export const setConfidence = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  confidence: Confidence,
  now?: Date,
): AttemptSnapshot =>
  touch(
    snapshot,
    { confidence: { ...snapshot.confidence, [nodeId]: confidence } },
    now,
  );

export const setReasoning = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  reasoning: string,
  now?: Date,
): AttemptSnapshot =>
  touch(
    snapshot,
    { reasoning: { ...snapshot.reasoning, [nodeId]: reasoning } },
    now,
  );

/**
 * Runs the bit's evaluator and stores answer, result and try count together, so
 * a snapshot never shows a result that belongs to a different answer.
 */
/**
 * An attempt already sitting at `nodeId`.
 *
 * For previewing one step of a long flow: reaching the last task of a
 * twenty-step assessment by answering the nineteen in front of it is not a
 * reasonable thing to ask of someone editing the twentieth. The history holds
 * only this node, so there is nothing behind it to go back to — a preview
 * starting in the middle should not pretend the middle was reached.
 */
export const attemptAt = (
  doc: BitflowDocument,
  nodeId: string,
  options: { attemptId?: string; now?: Date } = {},
): Result<AttemptSnapshot> => {
  if (!getNode(doc, nodeId)) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_FLOW",
        `The flow does not contain a node "${nodeId}".`,
      ),
    };
  }

  const created = createAttempt(doc, options);
  if (!created.ok) return created;

  return {
    ok: true,
    value: { ...created.value, currentNodeId: nodeId, history: [nodeId] },
  };
};

export const evaluateNode = async (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  nodeId: string,
  answer?: unknown,
  now?: Date,
): Promise<Result<AttemptSnapshot>> => {
  const node = getNode(doc, nodeId);
  if (!node) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_FLOW",
        `The flow does not contain a node "${nodeId}".`,
      ),
    };
  }

  const bit = getBit(node.type);
  if (!bit) {
    return {
      ok: false,
      error: bitflowError(
        "UNKNOWN_BIT_TYPE",
        `No bit is registered for type "${node.type}".`,
      ),
    };
  }

  const given = answer === undefined ? snapshot.answers[nodeId] : answer;

  let result: BitResult;
  if (!bit.evaluate) {
    // A content bit has nothing to grade; recording `unknown` keeps it out of
    // the score while still marking it as visited.
    result = { state: "unknown" };
  } else {
    // Parsed rather than passed through, exactly as `BitView` does before
    // rendering. A document written before a field existed, or by hand, or by
    // another tool, is missing that field entirely — and a bit reading it
    // then throws where the schema would simply have filled in its default.
    const parsed = bit.schema.safeParse(node.data);
    if (!parsed.success) {
      return {
        ok: false,
        error: bitflowError(
          "INVALID_FLOW",
          `Node "${nodeId}" (${node.type}) is not configured correctly: ${parsed.error.issues
            .map((issue) => issue.message)
            .join(" ")}`,
        ),
      };
    }

    try {
      result = await bit.evaluate({ data: parsed.data, answer: given });
    } catch (cause) {
      return {
        ok: false,
        error: bitflowError(
          "EVALUATION_FAILED",
          `Evaluating node "${nodeId}" (${node.type}) failed: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
        ),
      };
    }
  }

  return {
    ok: true,
    value: touch(
      snapshot,
      {
        answers: { ...snapshot.answers, [nodeId]: given },
        results: { ...snapshot.results, [nodeId]: weigh(result, node) },
        tries: { ...snapshot.tries, [nodeId]: (snapshot.tries[nodeId] ?? 0) + 1 },
      },
      now,
    ),
  };
};

/**
 * Scales a result by the task's weight, once, here.
 *
 * Doing it in the runtime rather than in each bit means a bit never thinks
 * about weighting and cannot forget to — including bits written later. The
 * weight is read off `data.evaluation`, the shape every task bit shares
 * (`EvaluationSchema`), and a bit without one is simply worth its own score.
 */
const weigh = (result: BitResult, node: BitNode): BitResult => {
  const evaluation = node.data?.evaluation as { weight?: unknown } | undefined;
  const weight = evaluation?.weight;
  if (typeof weight !== "number" || weight === 1 || weight < 0) return result;

  const base = scoreOf(result);
  return {
    ...result,
    score: { earned: base.earned * weight, possible: base.possible * weight },
  };
};

/**
 * Records that the learner passed on a node. The try counts (so branching on
 * `tries` sees it) but no result is stored, which keeps it out of the score.
 */
export const skipNode = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  now?: Date,
): AttemptSnapshot =>
  touch(
    snapshot,
    {
      results: { ...snapshot.results, [nodeId]: { state: "unknown" } },
      tries: { ...snapshot.tries, [nodeId]: (snapshot.tries[nodeId] ?? 0) + 1 },
    },
    now,
  );

/**
 * Clears the result so the learner can answer again. The try count is kept —
 * it is the record of how many attempts it took.
 */
export const retryNode = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  now?: Date,
): AttemptSnapshot => {
  const results = { ...snapshot.results };
  delete results[nodeId];
  return touch(snapshot, { results }, now);
};

// --- navigation -------------------------------------------------------------

const leaveCurrentNode = (
  snapshot: AttemptSnapshot,
  now?: Date,
): Pick<AttemptSnapshot, "elapsedMs"> => {
  const spent = Math.max(
    0,
    (now ?? new Date()).getTime() - new Date(snapshot.enteredAt).getTime(),
  );
  return {
    elapsedMs: {
      ...snapshot.elapsedMs,
      [snapshot.currentNodeId]:
        (snapshot.elapsedMs[snapshot.currentNodeId] ?? 0) + spent,
    },
  };
};

export const goNext = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  now?: Date,
): AttemptSnapshot => {
  if (snapshot.status !== "inProgress") return snapshot;

  const timestamp = nowIso(now);
  const target = nextNodeId(doc, snapshot.currentNodeId, conditionContext(snapshot));

  if (target === null) {
    return touch(
      snapshot,
      {
        ...leaveCurrentNode(snapshot, now),
        status: "completed",
        completedAt: timestamp,
      },
      now,
    );
  }

  const arrivedAtEnd = getBit(getNode(doc, target)?.type ?? "")?.kind === "end";

  return touch(
    snapshot,
    {
      ...leaveCurrentNode(snapshot, now),
      currentNodeId: target,
      history: [...snapshot.history, target],
      enteredAt: timestamp,
      ...(arrivedAtEnd
        ? { status: "completed" as const, completedAt: timestamp }
        : {}),
    },
    now,
  );
};

/**
 * Steps back through the visited history. The step is popped so going forward
 * again re-evaluates the branch — an answer changed in between must be able to
 * send the learner down a different path.
 */
export const goPrevious = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  now?: Date,
): AttemptSnapshot => {
  const target = previousNodeId(snapshot);
  if (target === null || !getNode(doc, target)) return snapshot;

  return touch(
    snapshot,
    {
      ...leaveCurrentNode(snapshot, now),
      currentNodeId: target,
      history: snapshot.history.slice(0, -1),
      enteredAt: nowIso(now),
      status: "inProgress",
      completedAt: undefined,
    },
    now,
  );
};

export const canGoPrevious = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
): boolean => {
  const target = previousNodeId(snapshot);
  return target !== null && getNode(doc, target) !== undefined;
};

export const isComplete = (snapshot: AttemptSnapshot): boolean =>
  snapshot.status === "completed";

export const isAtEnd = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
): boolean => isTerminalNode(doc, snapshot.currentNodeId);
