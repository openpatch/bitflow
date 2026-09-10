import { evaluateCondition, type ConditionContext } from "./condition";
import { getBit } from "./registry";
import { totalScore } from "./score";
import type {
  AttemptSnapshot,
  BitEdge,
  BitflowDocument,
  BitflowMeta,
  BitNode,
  BitResult,
} from "./schema";

export const getNode = (
  doc: BitflowDocument,
  nodeId: string,
): BitNode | undefined => doc.nodes.find((n) => n.id === nodeId);

/**
 * Outgoing edges in the order the engine considers them.
 *
 * Conditional edges come first so an unconditional edge acts as the "otherwise"
 * branch no matter which order the author drew them in. Within each group the
 * source handle then the edge id break ties, so traversal never depends on
 * array order in the file.
 */
const byPriority = (a: BitEdge, b: BitEdge): number => {
  const conditional = Number(Boolean(b.condition)) - Number(Boolean(a.condition));
  if (conditional !== 0) return conditional;
  const handle = (a.sourceHandle ?? "").localeCompare(b.sourceHandle ?? "");
  if (handle !== 0) return handle;
  return a.id.localeCompare(b.id);
};

export const outgoingEdges = (
  doc: BitflowDocument,
  nodeId: string,
): BitEdge[] => doc.edges.filter((e) => e.source === nodeId).sort(byPriority);

export const incomingEdges = (
  doc: BitflowDocument,
  nodeId: string,
): BitEdge[] => doc.edges.filter((e) => e.target === nodeId);

/**
 * Where a fresh attempt begins: the first registered `start` bit, else the
 * first node nothing points at, else simply the first node. The fallbacks
 * matter because tooling (the VS Code source view, validation) inspects
 * documents without every bit package loaded.
 */
export const startNodeId = (doc: BitflowDocument): string | undefined => {
  const start = doc.nodes.find((n) => getBit(n.type)?.kind === "start");
  if (start) return start.id;
  const orphan = doc.nodes.find((n) => incomingEdges(doc, n.id).length === 0);
  return (orphan ?? doc.nodes[0])?.id;
};

// --- pools ------------------------------------------------------------------

/**
 * The nodes belonging to a pool, in document order.
 *
 * Membership is read off the nodes rather than held as a list on the pool, so
 * a deleted step leaves nothing dangling behind it.
 */
export const poolMembers = (
  doc: BitflowDocument,
  poolId: string,
): BitNode[] => doc.nodes.filter((node) => node.pool === poolId);

/**
 * Chooses `draw` members of each pool.
 *
 * `random` is injectable so a test can be deterministic; nothing else passes
 * it. A pool asking for more members than it has simply gets all of them —
 * validation warns the author, and a learner mid-assessment is the wrong place
 * to enforce it.
 */
export const drawPools = (
  doc: BitflowDocument,
  random: () => number = Math.random,
): Record<string, string[]> => {
  const drawn: Record<string, string[]> = {};
  for (const pool of doc.meta.pools) {
    drawn[pool.id] = shuffle(
      poolMembers(doc, pool.id).map((node) => node.id),
      random,
    ).slice(0, pool.draw);
  }
  return drawn;
};

/** Fisher-Yates, on a copy. */
const shuffle = <T>(values: T[], random: () => number): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Whether this attempt walks through `nodeId` at all.
 *
 * Everything outside a pool is always active. A pool member is active only if
 * this attempt drew it — and if the attempt has no draw recorded for its pool
 * (an older snapshot, or a pool added since) it stays active, because hiding
 * steps from a learner on the strength of missing data is the worse failure.
 */
export const isActiveNode = (
  snapshot: AttemptSnapshot,
  node: BitNode | undefined,
): boolean => {
  if (!node?.pool) return true;
  const drawn = snapshot.pools[node.pool];
  return drawn === undefined || drawn.includes(node.id);
};

export const isTerminalNode = (
  doc: BitflowDocument,
  nodeId: string,
): boolean => {
  const node = getNode(doc, nodeId);
  if (!node) return true;
  if (getBit(node.type)?.kind === "end") return true;
  return outgoingEdges(doc, nodeId).length === 0;
};

/** A pool that shows its drawn members in a random order. */
const shuffledPoolOf = (
  doc: BitflowDocument,
  node: BitNode | undefined,
): BitflowMeta["pools"][number] | undefined => {
  if (!node?.pool) return undefined;
  const pool = doc.meta.pools.find((candidate) => candidate.id === node.pool);
  return pool?.shuffle ? pool : undefined;
};

/**
 * Edges that leave a pool — source inside it, target outside.
 *
 * A shuffled pool navigates by its drawn order rather than by its internal
 * wiring, so once the order runs out the only edges that still mean anything
 * are the ones pointing out of it. Which member happens to carry them does not
 * matter, and must not: after a shuffle the last member is a different one for
 * every learner.
 *
 * There is no matching `poolEntryEdges`, because the way *in* needs no rule:
 * every edge into a shuffled pool lands on whichever member the draw put first
 * (`redirectIntoPool`), so any number of them behave the same. Only the way out
 * is ambiguous, and `validateFlow` is where that gets said.
 */
export const poolExitEdges = (
  doc: BitflowDocument,
  poolId: string,
): BitEdge[] =>
  doc.edges
    .filter((edge) => {
      const source = getNode(doc, edge.source);
      const target = getNode(doc, edge.target);
      return (
        source?.pool === poolId &&
        target !== undefined &&
        target.pool !== poolId
      );
    })
    .sort(byPriority);

/**
 * Where the learner goes next, and over which edge.
 *
 * The edge is part of the answer because `resetTarget` lives on it: the runtime
 * has to know how it arrived somewhere to know what to clear on getting there.
 */
export type NextStep = {
  nodeId: string;
  /** Absent when the step came from a pool's drawn order rather than an edge. */
  edge?: BitEdge;
};

export type NextStepOptions = {
  /**
   * Pool members this attempt did not draw. They are stepped over as though
   * the graph did not contain them, which is what lets a pool be twenty
   * ordinary nodes chained together rather than a construct of its own.
   */
  isActive?: (node: BitNode) => boolean;
  /**
   * Pool id → the members this attempt drew, in the order to show them. Only
   * consulted for a pool with `shuffle` on; `AttemptSnapshot.pools` is what
   * goes here.
   */
  order?: Record<string, string[]>;
};

/**
 * The step that follows `currentId`, or `null` when the run is over.
 *
 * Pure: branching reads only the attempt context and the draw the attempt
 * already recorded, so replaying the same inputs always picks the same path.
 */
export const nextStep = (
  doc: BitflowDocument,
  currentId: string,
  context: ConditionContext,
  options: NextStepOptions = {},
): NextStep | null => {
  const { isActive = () => true, order = {} } = options;

  // A chain of undrawn members is walked through in one call, so the learner
  // never lands on one. Bounded by the node count: a cycle made entirely of
  // undrawn steps has no way out, and must not become an infinite loop.
  let from = currentId;
  for (let step = 0; step <= doc.nodes.length; step++) {
    const node = getNode(doc, from);
    if (!node) return null;
    if (getBit(node.type)?.kind === "end") return null;

    const candidate = stepFrom(doc, node, context, order);
    if (candidate === null) return null;

    const target = redirectIntoPool(doc, node, candidate, order);
    const next = getNode(doc, target.nodeId);
    if (next && isActive(next)) return target;
    from = target.nodeId;
  }
  return null;
};

/** `nextStep`, for callers that only need to know where. */
export const nextNodeId = (
  doc: BitflowDocument,
  currentId: string,
  context: ConditionContext,
  isActive: (node: BitNode) => boolean = () => true,
  order: Record<string, string[]> = {},
): string | null => nextStep(doc, currentId, context, { isActive, order })?.nodeId ?? null;

/** One hop out of `node`: along the pool's drawn order, or along an edge. */
const stepFrom = (
  doc: BitflowDocument,
  node: BitNode,
  context: ConditionContext,
  order: Record<string, string[]>,
): NextStep | null => {
  const pool = shuffledPoolOf(doc, node);
  // No draw recorded — an older snapshot, or a pool added since — so the pool
  // is walked exactly as it is wired rather than jumped out of.
  const drawn = pool ? order[pool.id] ?? [] : [];
  if (pool && drawn.length > 0) {
    const index = drawn.indexOf(node.id);
    if (index >= 0 && index + 1 < drawn.length) {
      return { nodeId: drawn[index + 1] };
    }
    // The order is spent (or this member was never in it): the way on is
    // whichever edge leaves the pool.
    return firstMatchingEdge(doc, poolExitEdges(doc, pool.id), context);
  }
  return firstMatchingEdge(doc, outgoingEdges(doc, node.id), context);
};

/**
 * Arriving at a shuffled pool from outside lands on whichever member the draw
 * put first, not on whichever one the author happened to wire the edge to.
 *
 * A pool with no draw recorded — an older snapshot, or a pool added since — is
 * walked exactly as it is wired, on the same reasoning as `isActiveNode`:
 * missing data must not change what the learner is shown.
 */
const redirectIntoPool = (
  doc: BitflowDocument,
  from: BitNode,
  candidate: NextStep,
  order: Record<string, string[]>,
): NextStep => {
  const pool = shuffledPoolOf(doc, getNode(doc, candidate.nodeId));
  if (!pool || from.pool === pool.id) return candidate;
  const drawn = order[pool.id] ?? [];
  if (drawn.length === 0) return candidate;
  return { ...candidate, nodeId: drawn[0] };
};

/** The first edge whose condition holds, and whose target exists. */
const firstMatchingEdge = (
  doc: BitflowDocument,
  edges: BitEdge[],
  context: ConditionContext,
): NextStep | null => {
  for (const edge of edges) {
    if (!edge.condition || evaluateCondition(edge.condition, context)) {
      if (getNode(doc, edge.target)) return { nodeId: edge.target, edge };
    }
  }
  return null;
};

/**
 * The previous node, read off the attempt's own history rather than walked
 * backwards through the graph. With conditions on edges a reverse walk cannot
 * tell which branch was actually taken.
 */
export const previousNodeId = (snapshot: AttemptSnapshot): string | null => {
  const { history } = snapshot;
  return history.length >= 2 ? history[history.length - 2] : null;
};

/** One row of the step list free navigation shows. */
export type VisitedStep = {
  nodeId: string;
  node: BitNode;
  /** Where it sits in the list, 1-based. */
  position: number;
  current: boolean;
  /** A task the learner has a result for. Always false for a content step. */
  answered: boolean;
  /** A task with no result yet — the thing a check-your-work list is for. */
  outstanding: boolean;
  section?: BitflowMeta["sections"][number];
};

/**
 * The steps the learner has been to, oldest first and each one once.
 *
 * Read off the history rather than the graph: with conditions on edges the
 * document cannot say which steps a particular learner saw. A step visited
 * twice — a remediation loop — is one row, at the position it first appeared.
 */
export const visitedSteps = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
): VisitedStep[] => {
  const steps: VisitedStep[] = [];
  const seen = new Set<string>();

  for (const nodeId of snapshot.history) {
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    const node = getNode(doc, nodeId);
    if (!node) continue;

    const isTask = getBit(node.type)?.kind === "task";
    const answered = snapshot.results[nodeId] !== undefined;
    steps.push({
      nodeId,
      node,
      position: steps.length + 1,
      current: nodeId === snapshot.currentNodeId,
      answered: isTask && answered,
      outstanding: isTask && !answered,
      section: sectionOf(doc, node),
    });
  }

  return steps;
};

/**
 * Whether the learner may jump straight to `nodeId`.
 *
 * Only somewhere they have already been, and only when the flow allows free
 * movement. Jumping forward is not on offer at any setting: which step comes
 * next depends on answers that have not been given yet, so there is nothing
 * truthful to jump to.
 */
export const canGoTo = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  nodeId: string,
): boolean =>
  doc.meta.navigation === "free" &&
  snapshot.history.includes(nodeId) &&
  getNode(doc, nodeId) !== undefined;

// --- sections ---------------------------------------------------------------

/** The section a step belongs to, if the flow still declares one. */
export const sectionOf = (
  doc: BitflowDocument,
  node: BitNode | undefined,
): BitflowMeta["sections"][number] | undefined =>
  node?.section
    ? doc.meta.sections.find((section) => section.id === node.section)
    : undefined;

/** The nodes in a section, in document order. */
export const sectionMembers = (
  doc: BitflowDocument,
  sectionId: string,
): BitNode[] => doc.nodes.filter((node) => node.section === sectionId);

// --- policy -----------------------------------------------------------------

/**
 * Whether the learner may pass on this task.
 *
 * The task decides when it says so, otherwise the flow does. Read off the data
 * rather than through the bit, so a bit never has to know the setting exists —
 * the same bargain `weight` and `timeLimit` already make.
 */
export const canSkip = (
  doc: BitflowDocument,
  node: BitNode | undefined,
): boolean => {
  const evaluation = node?.data?.evaluation as { allowSkip?: unknown } | undefined;
  return typeof evaluation?.allowSkip === "boolean"
    ? evaluation.allowSkip
    : doc.meta.allowSkip;
};

/**
 * Whether the learner may leave this step yet.
 *
 * Only a bit that declares `isComplete` can hold them, and only that bit knows
 * why — the runtime disables Next and leaves the explanation to the step. A
 * bit whose data does not parse is not held: refusing to let someone past a
 * step that is broken anyway traps them in the assessment.
 */
export const canLeaveNode = (
  node: BitNode | undefined,
  answer: unknown,
): boolean => {
  if (!node) return true;
  const bit = getBit(node.type);
  if (!bit?.isComplete) return true;
  const parsed = bit.schema.safeParse(node.data);
  if (!parsed.success) return true;
  return bit.isComplete({ data: parsed.data, answer });
};

// --- scoring ----------------------------------------------------------------

export const computeScore = (
  snapshot: AttemptSnapshot,
): { earned: number; possible: number } =>
  totalScore(Object.values(snapshot.results));

/**
 * Everything a branch may read, gathered out of the attempt in one place.
 *
 * Takes the document as well as the snapshot because time limits, sections and
 * the flow's own clock are properties of the assessment, not of the run.
 */
export const conditionContext = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  now: Date = new Date(),
): ConditionContext => {
  const visits: Record<string, number> = {};
  for (const nodeId of snapshot.history) {
    visits[nodeId] = (visits[nodeId] ?? 0) + 1;
  }

  const confidence: Record<string, number> = {};
  for (const [nodeId, value] of Object.entries(snapshot.confidence ?? {})) {
    confidence[nodeId] = value.level;
  }

  // Seconds, to match the units an author writes limits in. The node in
  // progress is included so "they have been on this one for two minutes" is a
  // branch that can fire while it is still true.
  const perNode: Record<string, number> = {};
  for (const nodeId of new Set([
    ...Object.keys(snapshot.elapsedMs),
    snapshot.currentNodeId,
  ])) {
    perNode[nodeId] = timeSpentOn(snapshot, nodeId, now) / 1000;
  }

  const spent = timeSpent(snapshot, now) / 1000;
  const limit = doc.meta.timeLimit ?? null;

  const sections: Record<string, string> = {};
  for (const node of doc.nodes) {
    if (node.section) sections[node.id] = node.section;
  }

  return {
    answers: snapshot.answers,
    results: snapshot.results,
    tries: snapshot.tries,
    visits,
    confidence,
    timeSpent: perNode,
    totalTimeSpent: spent,
    timeRemaining: limit === null ? null : Math.max(0, limit - spent),
    history: snapshot.history,
    sections,
  };
};

// --- collection -------------------------------------------------------------

export const collectAnswers = (
  snapshot: AttemptSnapshot,
  nodeIds?: string[],
): Record<string, unknown> => pick(snapshot.answers, nodeIds);

export const collectResults = (
  snapshot: AttemptSnapshot,
  nodeIds?: string[],
): Record<string, BitResult> => pick(snapshot.results, nodeIds);

const pick = <T>(
  source: Record<string, T>,
  keys?: string[],
): Record<string, T> => {
  if (!keys) return { ...source };
  const picked: Record<string, T> = {};
  for (const key of keys) {
    if (key in source) picked[key] = source[key];
  }
  return picked;
};

// --- distance ---------------------------------------------------------------

/**
 * Hops from `fromId` to the nearest (`optimistic`) or furthest (`pessimistic`)
 * terminal node, ignoring conditions — this feeds the progress indicator, which
 * must not depend on answers the learner has not given yet. Cycles are cut, and
 * a node with no route to an end returns `Infinity`.
 */
export const distanceToEnd = (
  doc: BitflowDocument,
  fromId: string,
  mode: "pessimistic" | "optimistic" = "optimistic",
  /**
   * Undrawn pool members cost nothing to pass, so a progress bar counts the
   * five steps this learner will take rather than the twenty in the file.
   */
  isActive: (node: BitNode) => boolean = () => true,
): number => {
  const visiting = new Set<string>();

  const walk = (nodeId: string): number => {
    if (isTerminalNode(doc, nodeId)) return 0;
    if (visiting.has(nodeId)) return Number.POSITIVE_INFINITY;

    visiting.add(nodeId);
    const distances = outgoingEdges(doc, nodeId)
      .map((edge) => {
        const target = getNode(doc, edge.target);
        const rest = walk(edge.target);
        if (!Number.isFinite(rest)) return rest;
        return target && !isActive(target) ? rest : rest + 1;
      })
      .filter(Number.isFinite);
    visiting.delete(nodeId);

    if (distances.length === 0) return Number.POSITIVE_INFINITY;
    return mode === "optimistic"
      ? Math.min(...distances)
      : Math.max(...distances);
  };

  return getNode(doc, fromId) ? walk(fromId) : Number.POSITIVE_INFINITY;
};

// --- time -------------------------------------------------------------------

/**
 * Milliseconds spent on one task, including the stretch in progress.
 *
 * Time *spent*, not elapsed wall clock: `elapsedMs` only accumulates while the
 * learner is actually on a node, so closing the tab pauses the clock. That is
 * the only rule a snapshot can honour across a reload, and the fairer one.
 */
export const timeSpentOn = (
  snapshot: AttemptSnapshot,
  nodeId: string,
  now: Date = new Date(),
): number => {
  const banked = snapshot.elapsedMs[nodeId] ?? 0;
  if (snapshot.currentNodeId !== nodeId || snapshot.status !== "inProgress") {
    return banked;
  }
  return banked + sinceEntering(snapshot, now);
};

/** Milliseconds spent across the whole attempt, on the same basis. */
export const timeSpent = (
  snapshot: AttemptSnapshot,
  now: Date = new Date(),
): number => {
  const banked = Object.values(snapshot.elapsedMs).reduce(
    (total, ms) => total + ms,
    0,
  );
  return snapshot.status === "inProgress"
    ? banked + sinceEntering(snapshot, now)
    : banked;
};

const sinceEntering = (snapshot: AttemptSnapshot, now: Date): number =>
  Math.max(0, now.getTime() - new Date(snapshot.enteredAt).getTime());

/** The task's own limit in milliseconds, or `null` when it has none. */
export const taskTimeLimit = (node: BitNode | undefined): number | null => {
  const evaluation = node?.data?.evaluation as { timeLimit?: unknown } | undefined;
  const seconds = evaluation?.timeLimit;
  return typeof seconds === "number" && seconds > 0 ? seconds * 1000 : null;
};

export type FlowProgress = {
  /** Nodes the learner has already been shown, including the current one. */
  visited: number;
  /** Best-case hops still to go; `Infinity` when the graph has no route out. */
  remaining: number;
  /** `0`–`1`, or `1` once the attempt is finished. */
  ratio: number;
};

export const flowProgress = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
): FlowProgress => {
  const visited = snapshot.history.length;
  if (snapshot.status !== "inProgress") {
    return { visited, remaining: 0, ratio: 1 };
  }
  const remaining = distanceToEnd(doc, snapshot.currentNodeId, "optimistic", (node) =>
    isActiveNode(snapshot, node),
  );
  const total = Number.isFinite(remaining) ? visited + remaining : visited;
  return { visited, remaining, ratio: total === 0 ? 0 : visited / total };
};
