import type { BitResult } from "@bitflow/core";
import type { Answer, Data } from "./schema";

/**
 * A point for every item in its authored place.
 *
 * H5P's rule, and the fair one: an ordering that is right except for one
 * transposed pair has clearly been understood, and all-or-nothing would say
 * otherwise. It does mean a single item shifted early costs every position
 * after it — which is true of the learner's answer as well as the scoring.
 */
export const correctPositions = (data: Data, order: string[]): string[] =>
  data.items
    .filter((item, index) => order[index] === item.id)
    .map((item) => item.id);

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

  const order = answer?.order ?? [];
  const right = correctPositions(data, order);
  const possible = data.items.length;
  const allRight = possible > 0 && right.length === possible;

  return {
    state: allRight ? "correct" : "wrong",
    score: { earned: right.length, possible },
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Which items are home, so each can be marked where it sits rather than
      // the learner being told a number and left to work out which.
      correct: right,
    },
  };
};
