import type { BitResult } from "@bitflow/core";
import { expectedPlacements, isNumericMode, searchPath, traversalOrder } from "./tree";
import type { Answer, Data } from "./schema";

/**
 * Why an answer is wrong, named for the mistake rather than for the check
 * that caught it — every one of these reads as a sentence about what the
 * learner chose, never about what the answer is, so it can be shown without
 * giving anything away.
 */
export const REASONS = [
  "correct",
  "empty",
  "wrongOrder",
  "missesPlaces",
  "extraSteps",
  "saidNotFoundButFound",
  "missedNotFound",
  "wrongPlacement",
] as const;
export type Reason = (typeof REASONS)[number];

/** How far a chosen sequence agrees with the expected one before it differs. */
const agreeingPrefix = (chosen: string[], expected: string[]): number => {
  let prefix = 0;
  while (prefix < chosen.length && prefix < expected.length && chosen[prefix] === expected[prefix]) {
    prefix += 1;
  }
  return prefix;
};

/** `wrongOrder` if it went wrong partway, `missesPlaces` if it stopped early, `extraSteps` if it ran on past a right answer. */
const sequenceReason = (prefix: number, chosen: string[], expected: string[]): Reason => {
  if (prefix < chosen.length) return "wrongOrder";
  if (chosen.length < expected.length) return "missesPlaces";
  return "extraSteps";
};

const evaluateTraversal = (data: Data, answer: Answer | undefined): BitResult => {
  const expected = traversalOrder(data.tree.nodes, data.tree.root, data.traversal);
  const ids = new Set(data.tree.nodes.map((node) => node.id));
  const chosen = (answer?.sequence ?? []).filter((id) => ids.has(id));

  const prefix = agreeingPrefix(chosen, expected);
  const correct = prefix === expected.length && chosen.length === expected.length;
  const reason: Reason = chosen.length === 0 ? "empty" : correct ? "correct" : sequenceReason(prefix, chosen, expected);

  const outOf = expected.length;
  const score =
    data.partialCredit && outOf > 0
      ? { earned: prefix, possible: outOf }
      : { earned: correct ? 1 : 0, possible: 1 };

  return {
    state: correct ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { reason, correctPrefix: prefix },
  };
};

const evaluateSearch = (data: Data, answer: Answer | undefined): BitResult => {
  const numeric = isNumericMode(data);
  const { path, found } = searchPath(data.tree.nodes, data.tree.root, data.searchKey, numeric);
  const ids = new Set(data.tree.nodes.map((node) => node.id));
  const chosen = (answer?.sequence ?? []).filter((id) => ids.has(id));
  const claimedNotFound = answer?.notFound ?? false;

  const prefix = agreeingPrefix(chosen, path);
  const pathRight = prefix === path.length && chosen.length === path.length;
  const notFoundRight = claimedNotFound === !found;
  const correct = pathRight && notFoundRight;

  let reason: Reason;
  if (chosen.length === 0 && !claimedNotFound) reason = "empty";
  else if (!pathRight) reason = sequenceReason(prefix, chosen, path);
  else if (!notFoundRight) reason = found ? "saidNotFoundButFound" : "missedNotFound";
  else reason = "correct";

  // One extra step of "worth", for the not-found decision, on top of a point
  // per place on the path — so getting the walk right but the verdict wrong
  // (or the reverse) still earns most of what the task asks for.
  const outOf = path.length + (found ? 0 : 1);
  const earnedNotFound = found ? 0 : claimedNotFound ? 1 : 0;
  const score =
    data.partialCredit && outOf > 0
      ? { earned: prefix + earnedNotFound, possible: outOf }
      : { earned: correct ? 1 : 0, possible: 1 };

  return {
    state: correct ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { reason, correctPrefix: prefix },
  };
};

export type PlacementState = "correct" | "wrong" | "pending";

const evaluateInsert = (data: Data, answer: Answer | undefined): BitResult => {
  const numeric = isNumericMode(data);
  const expected = expectedPlacements(data.tree, data.insertKeys, numeric);
  const chosen = answer?.placements ?? [];

  const states: PlacementState[] = data.insertKeys.map((_, index) => {
    if (index >= chosen.length) return "pending";
    const placement = chosen[index];
    const right =
      placement.parent === expected[index].parent && placement.side === expected[index].side;
    return right ? "correct" : "wrong";
  });

  const earned = states.filter((state) => state === "correct").length;
  const possible = data.insertKeys.length;
  const done = chosen.length >= possible;
  const correct = done && earned === possible;

  const reason: Reason = chosen.length === 0 ? "empty" : correct ? "correct" : "wrongPlacement";
  const score =
    data.partialCredit && possible > 0
      ? { earned, possible }
      : { earned: correct ? 1 : 0, possible: 1 };

  return {
    state: correct ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { reason, states },
  };
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

  switch (data.mode) {
    case "search":
      return evaluateSearch(data, answer);
    case "insert":
      return evaluateInsert(data, answer);
    default:
      return evaluateTraversal(data, answer);
  }
};
