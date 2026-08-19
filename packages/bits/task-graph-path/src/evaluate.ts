import type { BitResult } from "@bitflow/core";
import {
  breakIn,
  cutCost,
  distancesFrom,
  minimumCutCost,
  routeCost,
  sameCost,
  spanningTreeCost,
  traversalOrder,
  treeCost,
  treeShape,
} from "./graph";
import { answerOf, type Answer, type Data } from "./schema";

/**
 * Why an answer is wrong.
 *
 * Named for the mistake rather than for the check that caught it, because it is
 * shown to the learner: "that route does not arrive" is worth reading, and it
 * gives nothing away — every one of these is a statement about what *they*
 * chose, not about what the answer is.
 */
export const REASONS = [
  "correct",
  "empty",
  "notFromSource",
  "notToTarget",
  "broken",
  "repeats",
  "notShortest",
  "wrongOrder",
  "missesPlaces",
  "treeWrongSize",
  "treeCycle",
  "treeDisconnected",
  "notCheapestTree",
  "notSeparating",
  "notCheapestCut",
] as const;
export type Reason = (typeof REASONS)[number];

export type Verdict = {
  correct: boolean;
  reason: Reason;
  /**
   * How much of a traversal was right before it went wrong. Only a traversal
   * has one: a route that does not arrive is not "most of a route".
   */
  correctPrefix?: number;
  /** How long the right answer is, where that is a count worth scoring out of. */
  outOf?: number;
};

const verdict = (reason: Reason, over: Partial<Verdict> = {}): Verdict => ({
  correct: reason === "correct",
  reason,
  ...over,
});

/** Marks a route: joined up, from the right place to the right place. */
const judgeRoute = (data: Data, chosen: string[]): Verdict => {
  if (chosen.length === 0) return verdict("empty");
  if (chosen[0] !== data.sourceId) return verdict("notFromSource");
  if (chosen[chosen.length - 1] !== data.targetId) return verdict("notToTarget");
  if (new Set(chosen).size !== chosen.length) return verdict("repeats");
  if (breakIn(data, chosen) !== undefined) return verdict("broken");

  if (data.goal === "path") return verdict("correct");

  // A cheapest route is marked against what the cheapest route costs, not
  // against one the author wrote down — so every equally cheap alternative is
  // right without anybody having to list them.
  const cost = routeCost(data, chosen) as number;
  const best = distancesFrom(data, data.sourceId).get(data.targetId);
  if (best === undefined) return verdict("notToTarget");
  return sameCost(cost, best) ? verdict("correct") : verdict("notShortest");
};

/** Marks a traversal, and says how much of it was right. */
const judgeTraversal = (data: Data, chosen: string[]): Verdict => {
  const expected = traversalOrder(data, data.sourceId);

  let prefix = 0;
  while (prefix < chosen.length && prefix < expected.length && chosen[prefix] === expected[prefix]) {
    prefix += 1;
  }

  const outOf = expected.length;
  if (chosen.length === 0) return verdict("empty", { correctPrefix: 0, outOf });
  if (prefix === outOf && chosen.length === outOf) {
    return verdict("correct", { correctPrefix: prefix, outOf });
  }
  // Stopping early and going wrong are different mistakes, and the learner can
  // tell which they made from the order they can still see.
  const reason = prefix === chosen.length ? "missesPlaces" : "wrongOrder";
  return verdict(reason, { correctPrefix: prefix, outOf });
};

/** Marks a spanning tree: a tree, spanning, and as cheap as one can be. */
const judgeTree = (data: Data, chosen: string[]): Verdict => {
  if (chosen.length === 0) return verdict("empty");

  const shape = treeShape(data, chosen);
  if (shape === "cycle") return verdict("treeCycle");
  if (shape === "disconnected") return verdict("treeDisconnected");
  if (shape === "wrongSize") return verdict("treeWrongSize");

  const best = spanningTreeCost(data);
  if (best === undefined) return verdict("treeDisconnected");
  return sameCost(treeCost(data, chosen), best)
    ? verdict("correct")
    : verdict("notCheapestTree");
};

/** Marks a cut, given as the places left on the start's side. */
const judgeCut = (data: Data, chosen: string[]): Verdict => {
  if (chosen.length === 0) return verdict("empty");
  const side = new Set(chosen);
  if (!side.has(data.sourceId) || side.has(data.targetId)) {
    return verdict("notSeparating");
  }

  const best = minimumCutCost(data, data.sourceId, data.targetId);
  if (best === undefined) return verdict("notSeparating");
  return sameCost(cutCost(data, chosen), best)
    ? verdict("correct")
    : verdict("notCheapestCut");
};

export const judge = (data: Data, answer: Answer | undefined): Verdict => {
  const chosen = answerOf(data.goal, answer).filter((id) =>
    data.goal === "spanningTree"
      ? data.edges.some((edge) => edge.id === id)
      : data.nodes.some((node) => node.id === id),
  );

  switch (data.goal) {
    case "traversal":
      return judgeTraversal(data, chosen);
    case "spanningTree":
      return judgeTree(data, chosen);
    case "cut":
      return judgeCut(data, chosen);
    default:
      return judgeRoute(data, chosen);
  }
};

export const evaluate = ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): BitResult => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const outcome = judge(data, answer);

  // Only a traversal is scored out of anything but one. A route that does not
  // arrive is not two-thirds of a route, and a set of edges that is not a tree
  // is not most of a tree — saying otherwise would pay for an answer that does
  // not answer the question.
  const score =
    data.goal === "traversal" && data.partialCredit && outcome.outOf
      ? { earned: outcome.correctPrefix ?? 0, possible: outcome.outOf }
      : { earned: outcome.correct ? 1 : 0, possible: 1 };

  return {
    state: outcome.correct ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      reason: outcome.reason,
      ...(outcome.correctPrefix === undefined
        ? {}
        : { correctPrefix: outcome.correctPrefix }),
    },
  };
};
