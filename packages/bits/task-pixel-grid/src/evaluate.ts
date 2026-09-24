import type { BitResult } from "@bitflow/core";
import { isGiven, type Answer, type Data } from "./schema";

/**
 * Which free cells disagree with the picture, rows by columns. A given cell
 * is never wrong — the learner never touched it, so it cannot be held against
 * them — which is also what keeps a task made entirely of locked cells from
 * ever failing on cells nobody could have painted.
 */
export const wrongCells = (data: Data, answer?: Answer): boolean[][] =>
  Array.from({ length: data.rows }, (_row, row) =>
    Array.from({ length: data.columns }, (_column, column) => {
      if (isGiven(data, row, column)) return false;
      const painted = answer?.cells?.[row]?.[column] ?? data.startColor;
      const wanted = data.target[row]?.[column] ?? data.startColor;
      return painted !== wanted;
    }),
  );

/**
 * A point per free cell painted correctly, or one point for the whole picture,
 * depending on `partialCredit`. Either way the locked cells are worth nothing
 * and cost nothing — they were never the learner's to get right.
 */
export const scoreOf = (
  data: Data,
  answer?: Answer,
): { earned: number; possible: number } => {
  const wrong = wrongCells(data, answer);
  let correct = 0;
  let free = 0;
  for (let row = 0; row < data.rows; row++) {
    for (let column = 0; column < data.columns; column++) {
      if (isGiven(data, row, column)) continue;
      free += 1;
      if (!wrong[row][column]) correct += 1;
    }
  }

  if (!data.partialCredit) {
    return { earned: free > 0 && correct === free ? 1 : 0, possible: free > 0 ? 1 : 0 };
  }
  return { earned: correct, possible: free };
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

  const score = scoreOf(data, answer);
  const allRight = score.possible > 0 && score.earned === score.possible;

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // So the learner's own grid can mark the cells it got wrong once
      // checked, without recomputing the comparison from a raw answer the
      // Task component would otherwise have no reason to hold onto.
      wrong: wrongCells(data, answer),
    },
  };
};
