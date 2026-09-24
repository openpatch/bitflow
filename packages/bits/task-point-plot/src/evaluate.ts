import type { BitResult } from "@bitflow/core";
import { openPoints, type Answer, type Data } from "./schema";

export type PointState = "correct" | "wrong";

/** Open point id → whether the learner's assignment matches `expected`. */
export type PointStates = Record<string, PointState>;

/**
 * Marking never runs `nearestCentroid` or `knn` — only the author's `expected`
 * decides. That is what lets an author write a deliberately tricky point (one
 * a real k-nearest-neighbours run would get wrong, on purpose, to make a
 * point about outliers) and have it graded the way it was asked rather than
 * the way an algorithm run again here would answer it.
 */
export const pointStates = (data: Data, answer: Answer | undefined): PointStates => {
  const states: PointStates = {};
  for (const point of openPoints(data)) {
    const given = answer?.assignments?.[point.id];
    states[point.id] = given === point.expected ? "correct" : "wrong";
  }
  return states;
};

/** A point per open point that was assigned correctly. */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const values = Object.values(pointStates(data, answer));
  return {
    earned: values.filter((state) => state === "correct").length,
    possible: values.length,
  };
};

/** Whether every open point was assigned to its expected class. */
export const allCorrect = (data: Data, answer: Answer | undefined): boolean => {
  const values = Object.values(pointStates(data, answer));
  return values.length > 0 && values.every((state) => state === "correct");
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

  const right = allCorrect(data, answer);
  const points = scoreOf(data, answer);

  // All or nothing when the author says so, and when there is nothing to
  // count: a plot with no open points would otherwise be scored out of zero.
  const score =
    data.partialCredit && points.possible > 0
      ? points
      : { earned: right ? 1 : 0, possible: 1 };

  return {
    state: right ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { points: pointStates(data, answer) },
  };
};
