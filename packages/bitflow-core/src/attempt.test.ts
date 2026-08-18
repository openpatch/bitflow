import { beforeEach, describe, expect, it } from "vitest";
import {
  abandonAttempt,
  canGoPrevious,
  createAttempt,
  evaluateNode,
  goNext,
  goPrevious,
  restoreAttempt,
  retryNode,
  setAnswer,
  setConfidence,
  setReasoning,
  skipNode,
} from "./attempt";
import { computeScore } from "./engine";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { AttemptSnapshot, BitflowDocument } from "./schema";

const flow = doc(
  [
    node("start", "test-start"),
    node("q1", "test-task", { correct: "a" }),
    node("q2", "test-task", { correct: "b" }),
    node("end", "test-end"),
  ],
  [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
);

const start = (document: BitflowDocument = flow): AttemptSnapshot => {
  const created = createAttempt(document);
  if (!created.ok) throw new Error(created.error.message);
  return created.value;
};

const evaluated = async (
  snapshot: AttemptSnapshot,
  nodeId: string,
  answer: unknown,
): Promise<AttemptSnapshot> => {
  const result = await evaluateNode(flow, snapshot, nodeId, answer);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("attempt runtime", () => {
  beforeEach(registerTestBits);

  it("creates an in-progress attempt at the start node", () => {
    const snapshot = start();
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      flowId: "test-flow",
      flowSchemaVersion: 1,
      status: "inProgress",
      currentNodeId: "start",
      history: ["start"],
      answers: {},
      results: {},
      tries: {},
    });
  });

  it("refuses to start an empty flow", () => {
    const created = createAttempt(doc([], []));
    expect(created.ok).toBe(false);
    if (!created.ok) expect(created.error.code).toBe("INVALID_FLOW");
  });

  it("records answer, result and try count together", async () => {
    const snapshot = await evaluated(start(), "q1", "a");
    expect(snapshot.answers.q1).toBe("a");
    expect(snapshot.results.q1).toEqual({ state: "correct" });
    expect(snapshot.tries.q1).toBe(1);
  });

  it("counts a second evaluation as a second try", async () => {
    let snapshot = await evaluated(start(), "q1", "wrong");
    snapshot = retryNode(snapshot, "q1");
    expect(snapshot.results.q1).toBeUndefined();
    expect(snapshot.tries.q1).toBe(1);

    snapshot = await evaluated(snapshot, "q1", "a");
    expect(snapshot.results.q1).toEqual({ state: "correct" });
    expect(snapshot.tries.q1).toBe(2);
  });

  it("reports an unknown bit type rather than throwing", async () => {
    const unknown = doc([node("x", "not-registered")], []);
    const created = createAttempt(unknown);
    if (!created.ok) throw new Error("expected an attempt");
    const result = await evaluateNode(unknown, created.value, "x", "a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNKNOWN_BIT_TYPE");
  });

  it("turns a throwing evaluator into an EVALUATION_FAILED error", async () => {
    const { registerBit } = await import("./registry");
    const { z } = await import("zod");
    registerBit({
      type: "test-broken",
      kind: "task",
      schema: z.object({}),
      defaultData: () => ({}),
      info: () => ({ name: "Broken", description: "throws" }),
      evaluate: () => {
        throw new Error("boom");
      },
    });
    const broken = doc([node("x", "test-broken")], []);
    const created = createAttempt(broken);
    if (!created.ok) throw new Error("expected an attempt");
    const result = await evaluateNode(broken, created.value, "x", "a");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("EVALUATION_FAILED");
      expect(result.error.message).toContain("boom");
    }
  });

  it("fills in a missing field from the schema before grading", async () => {
    const { registerBit } = await import("./registry");
    const { z } = await import("zod");
    registerBit({
      type: "test-defaulted",
      kind: "task",
      schema: z.object({ cutoffs: z.record(z.string(), z.number()).default({}) }),
      defaultData: () => ({ cutoffs: {} }),
      info: () => ({ name: "Defaulted", description: "reads a defaulted field" }),
      // Reads the field the way a real bit does, without guarding it.
      evaluate: ({ data }) => ({
        state:
          (data as { cutoffs: Record<string, number> }).cutoffs["a"] === undefined
            ? "correct"
            : "wrong",
      }),
    });

    // A document written before `cutoffs` existed, or by hand, has no such
    // key. This used to reach the bit raw and throw on the first property
    // access, surfacing as EVALUATION_FAILED to the learner.
    const older = doc([node("x", "test-defaulted", {})], []);
    const created = createAttempt(older);
    if (!created.ok) throw new Error("expected an attempt");

    const result = await evaluateNode(older, created.value, "x", "a");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.results.x.state).toBe("correct");
  });

  it("reports data the schema rejects instead of letting the bit throw", async () => {
    const { registerBit } = await import("./registry");
    const { z } = await import("zod");
    registerBit({
      type: "test-strict",
      kind: "task",
      schema: z.object({ needed: z.string() }),
      defaultData: () => ({ needed: "" }),
      info: () => ({ name: "Strict", description: "needs a field" }),
      evaluate: () => ({ state: "correct" }),
    });

    const broken = doc([node("x", "test-strict", { needed: 42 })], []);
    const created = createAttempt(broken);
    if (!created.ok) throw new Error("expected an attempt");

    const result = await evaluateNode(broken, created.value, "x", "a");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_FLOW");
  });

  it("keeps a skipped node out of the score but counts the try", () => {
    const snapshot = skipNode(start(), "q1");
    expect(snapshot.tries.q1).toBe(1);
    expect(computeScore(snapshot)).toEqual({ earned: 0, possible: 0 });
  });

  it("scores one point per correct task by default", async () => {
    let snapshot = await evaluated(start(), "q1", "a");
    snapshot = await evaluated(snapshot, "q2", "wrong");
    expect(computeScore(snapshot)).toEqual({ earned: 1, possible: 2 });
  });

  describe("navigation", () => {
    it("advances, records history and accumulates time", () => {
      const t0 = new Date("2026-01-01T10:00:00.000Z");
      const t1 = new Date("2026-01-01T10:00:05.000Z");
      const snapshot = goNext(flow, { ...start(), enteredAt: t0.toISOString() }, t1);

      expect(snapshot.currentNodeId).toBe("q1");
      expect(snapshot.history).toEqual(["start", "q1"]);
      expect(snapshot.elapsedMs.start).toBe(5000);
      expect(snapshot.enteredAt).toBe(t1.toISOString());
    });

    it("completes on arrival at an end bit", () => {
      let snapshot = start();
      snapshot = goNext(flow, snapshot); // q1
      snapshot = goNext(flow, snapshot); // q2
      expect(snapshot.status).toBe("inProgress");
      snapshot = goNext(flow, snapshot); // end
      expect(snapshot.currentNodeId).toBe("end");
      expect(snapshot.status).toBe("completed");
      expect(snapshot.completedAt).toBeDefined();
    });

    it("completes when a node simply has nowhere left to go", () => {
      const stub = doc([node("only", "test-content")], []);
      const snapshot = goNext(stub, start(stub));
      expect(snapshot.status).toBe("completed");
      expect(snapshot.currentNodeId).toBe("only");
    });

    it("goes back through history and pops the step", () => {
      let snapshot = goNext(flow, start());
      expect(canGoPrevious(flow, snapshot)).toBe(true);
      snapshot = goPrevious(flow, snapshot);
      expect(snapshot.currentNodeId).toBe("start");
      expect(snapshot.history).toEqual(["start"]);
      expect(canGoPrevious(flow, snapshot)).toBe(false);
    });

    it("does nothing when there is no history to go back to", () => {
      const snapshot = start();
      expect(goPrevious(flow, snapshot)).toBe(snapshot);
    });

    it("ignores navigation once the attempt is finished", () => {
      const finished = abandonAttempt(start());
      expect(goNext(flow, finished)).toBe(finished);
    });
  });

  describe("restore", () => {
    it("round-trips a snapshot through JSON", async () => {
      const snapshot = await evaluated(goNext(flow, start()), "q1", "a");
      const restored = restoreAttempt(flow, JSON.stringify(snapshot));
      expect(restored.ok).toBe(true);
      if (restored.ok) expect(restored.value).toEqual(snapshot);
    });

    it("restores confidence and reasoning", () => {
      let snapshot = setConfidence(start(), "q1", { level: 0.75 });
      snapshot = setReasoning(snapshot, "q1", "I guessed.");
      const restored = restoreAttempt(flow, snapshot);
      expect(restored.ok).toBe(true);
      if (restored.ok) {
        expect(restored.value.confidence?.q1).toEqual({ level: 0.75 });
        expect(restored.value.reasoning?.q1).toBe("I guessed.");
      }
    });

    it("rejects a snapshot from a different flow", () => {
      const snapshot = { ...start(), flowId: "some-other-flow" };
      const restored = restoreAttempt(flow, snapshot);
      expect(restored.ok).toBe(false);
      if (!restored.ok) expect(restored.error.code).toBe("FLOW_ATTEMPT_MISMATCH");
    });

    it("rejects a snapshot recorded against another flow schema version", () => {
      const restored = restoreAttempt(flow, { ...start(), flowSchemaVersion: 99 });
      expect(restored.ok).toBe(false);
      if (!restored.ok) expect(restored.error.code).toBe("FLOW_ATTEMPT_MISMATCH");
    });

    it("rejects a snapshot stopped at a node the flow does not have", () => {
      const restored = restoreAttempt(flow, {
        ...start(),
        currentNodeId: "ghost",
        history: ["ghost"],
      });
      expect(restored.ok).toBe(false);
      if (!restored.ok) expect(restored.error.code).toBe("FLOW_ATTEMPT_MISMATCH");
    });

    it("rejects a malformed snapshot with field-level diagnostics", () => {
      const restored = restoreAttempt(flow, { ...start(), status: "nonsense" });
      expect(restored.ok).toBe(false);
      if (!restored.ok) {
        expect(restored.error.code).toBe("INVALID_ATTEMPT");
        expect(restored.error.diagnostics?.[0]?.path).toBe("status");
      }
    });

    it("rejects text that is not JSON", () => {
      const restored = restoreAttempt(flow, "{not json");
      expect(restored.ok).toBe(false);
      if (!restored.ok) expect(restored.error.code).toBe("INVALID_ATTEMPT");
    });
  });

  it("treats a durable answer change as an update without evaluating", () => {
    const snapshot = setAnswer(start(), "q1", "a");
    expect(snapshot.answers.q1).toBe("a");
    expect(snapshot.results.q1).toBeUndefined();
    expect(snapshot.tries.q1).toBeUndefined();
  });
});

describe("task weight", () => {
  beforeEach(registerTestBits);

  const weighted = (weight: number): BitflowDocument =>
    doc(
      [
        node("start", "test-start"),
        node("q1", "test-task", { correct: "a", evaluation: { weight } }),
        node("q2", "test-task", { correct: "b" }),
        node("end", "test-end"),
      ],
      [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
    );

  const answerBoth = async (document: BitflowDocument) => {
    const created = createAttempt(document);
    if (!created.ok) throw new Error(created.error.message);
    let snapshot = created.value;
    for (const [nodeId, answer] of [
      ["q1", "a"],
      ["q2", "b"],
    ] as const) {
      const evaluated = await evaluateNode(document, snapshot, nodeId, answer);
      if (!evaluated.ok) throw new Error(evaluated.error.message);
      snapshot = evaluated.value;
    }
    return snapshot;
  };

  it("multiplies what a correct answer is worth", async () => {
    const snapshot = await answerBoth(weighted(3));
    expect(snapshot.results.q1.score).toEqual({ earned: 3, possible: 3 });
    expect(computeScore(snapshot)).toEqual({ earned: 4, possible: 4 });
  });

  it("scales what a wrong answer costs, not just what it earns", async () => {
    const document = weighted(3);
    const created = createAttempt(document);
    if (!created.ok) throw new Error(created.error.message);
    const evaluated = await evaluateNode(document, created.value, "q1", "wrong");
    if (!evaluated.ok) throw new Error(evaluated.error.message);

    // Still out of three: a heavy task the learner got wrong has to weigh on
    // the total, or weighting would only ever help.
    expect(evaluated.value.results.q1.score).toEqual({ earned: 0, possible: 3 });
  });

  it("leaves a result untouched at the default weight", async () => {
    const snapshot = await answerBoth(weighted(1));
    // No score is written where the bit did not write one, so a snapshot of an
    // unweighted flow stays as it was.
    expect(snapshot.results.q1.score).toBeUndefined();
    expect(computeScore(snapshot)).toEqual({ earned: 2, possible: 2 });
  });

  it("can take a task out of the score entirely", async () => {
    const snapshot = await answerBoth(weighted(0));
    expect(snapshot.results.q1.score).toEqual({ earned: 0, possible: 0 });
    expect(computeScore(snapshot)).toEqual({ earned: 1, possible: 1 });
  });

  it("ignores a weight that is not a usable number", async () => {
    const snapshot = await answerBoth(weighted(-2 as number));
    expect(snapshot.results.q1.score).toBeUndefined();
  });
});
