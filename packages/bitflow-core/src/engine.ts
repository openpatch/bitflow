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
): string | null => {
  const node = getNode(doc, currentId);
  if (!node) return null;
  if (getBit(node.type)?.kind === "end") return null;

  for (const edge of outgoingEdges(doc, currentId)) {
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
): number => {
  const visiting = new Set<string>();

  const walk = (nodeId: string): number => {
    if (isTerminalNode(doc, nodeId)) return 0;
    if (visiting.has(nodeId)) return Number.POSITIVE_INFINITY;

    visiting.add(nodeId);
    const distances = outgoingEdges(doc, nodeId)
      .map((edge) => walk(edge.target))
      .filter(Number.isFinite)
      .map((d) => d + 1);
    visiting.delete(nodeId);

    if (distances.length === 0) return Number.POSITIVE_INFINITY;
    return mode === "optimistic"
      ? Math.min(...distances)
      : Math.max(...distances);
  };

  return getNode(doc, fromId) ? walk(fromId) : Number.POSITIVE_INFINITY;
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
  const remaining = distanceToEnd(doc, snapshot.currentNodeId, "optimistic");
  const total = Number.isFinite(remaining) ? visited + remaining : visited;
  return { visited, remaining, ratio: total === 0 ? 0 : visited / total };
};
