import { evaluateCondition, type ConditionContext } from "./condition";
import { getBit } from "./registry";
import type {
  AttemptSnapshot,
  BitEdge,
  BitflowDocument,
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
export const outgoingEdges = (
  doc: BitflowDocument,
  nodeId: string,
): BitEdge[] =>
  doc.edges
    .filter((e) => e.source === nodeId)
    .sort((a, b) => {
      const conditional = Number(Boolean(b.condition)) - Number(Boolean(a.condition));
      if (conditional !== 0) return conditional;
      const handle = (a.sourceHandle ?? "").localeCompare(b.sourceHandle ?? "");
      if (handle !== 0) return handle;
      return a.id.localeCompare(b.id);
    });

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

/**
 * The node that follows `currentId`, or `null` when the run is over.
 *
 * Pure: branching reads only the attempt context, so replaying the same
 * context always picks the same path.
 */
export const nextNodeId = (
  doc: BitflowDocument,
  currentId: string,
  context: ConditionContext,
  /**
   * Pool members this attempt did not draw. They are stepped over as though
   * the graph did not contain them, which is what lets a pool be twenty
   * ordinary nodes chained together rather than a construct of its own.
   */
  isActive: (node: BitNode) => boolean = () => true,
): string | null => {
  // A chain of undrawn members is walked through in one call, so the learner
  // never lands on one. Bounded by the node count: a cycle made entirely of
  // undrawn steps has no way out, and must not become an infinite loop.
  let from = currentId;
  for (let step = 0; step <= doc.nodes.length; step++) {
    const node = getNode(doc, from);
    if (!node) return null;
    if (getBit(node.type)?.kind === "end") return null;

    const target = firstEdgeTarget(doc, from, context);
    if (target === null) return null;

    const next = getNode(doc, target);
    if (next && isActive(next)) return target;
    from = target;
  }
  return null;
};

/** The first outgoing edge whose condition holds, and whose target exists. */
const firstEdgeTarget = (
  doc: BitflowDocument,
  nodeId: string,
  context: ConditionContext,
): string | null => {
  for (const edge of outgoingEdges(doc, nodeId)) {
    if (!edge.condition || evaluateCondition(edge.condition, context)) {
      if (getNode(doc, edge.target)) return edge.target;
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

// --- scoring ----------------------------------------------------------------

/**
 * A bit's result may carry its own `score`. When it does not, the bit is worth
 * one point, earned iff the state is `correct`. `unknown` contributes nothing
 * to either side: it was never graded, so it must not drag the ratio down.
 */
export const scoreOf = (result: BitResult): { earned: number; possible: number } => {
  if (result.score) return result.score;
  if (result.state === "unknown") return { earned: 0, possible: 0 };
  return { earned: result.state === "correct" ? 1 : 0, possible: 1 };
};

export const computeScore = (
  snapshot: AttemptSnapshot,
): { earned: number; possible: number } => {
  let earned = 0;
  let possible = 0;
  for (const result of Object.values(snapshot.results)) {
    const score = scoreOf(result);
    earned += score.earned;
    possible += score.possible;
  }
  return { earned, possible };
};

export const conditionContext = (
  snapshot: AttemptSnapshot,
): ConditionContext => ({
  answers: snapshot.answers,
  results: snapshot.results,
  tries: snapshot.tries,
  score: computeScore(snapshot),
});

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
