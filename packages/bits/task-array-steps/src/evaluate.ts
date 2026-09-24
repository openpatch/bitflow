import type { BitResult } from "@bitflow/core";
import { carryForward, type Answer, type Data } from "./schema";

/** A cell as it is compared: trimmed, and case-folded unless the author asked
 *  to keep case significant. */
export const normaliseCell = (value: string, caseSensitive: boolean): string => {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
};

/**
 * Drops empty cells off the end of a row.
 *
 * `write` mode always shows a fixed number of boxes, so a stack that has
 * shrunk to three items still has two trailing blanks in what the learner
 * typed. Those blanks are the answer for a box the stack no longer reaches,
 * not a value to compare — trimming them is what makes `["4", "2", "", ""]`
 * and `["4", "2"]` the same row.
 */
export const trimTrailingBlanks = (row: string[]): string[] => {
  const trimmed = [...row];
  while (trimmed.length > 0 && trimmed[trimmed.length - 1].trim() === "") {
    trimmed.pop();
  }
  return trimmed;
};

/** Whether a row is the array the author expected, once trailing blanks and
 *  case are out of the way. */
export const rowCorrect = (
  expected: string[],
  given: string[],
  caseSensitive: boolean,
): boolean => {
  const wanted = trimTrailingBlanks(expected).map((cell) =>
    normaliseCell(cell, caseSensitive),
  );
  const got = trimTrailingBlanks(given).map((cell) => normaliseCell(cell, caseSensitive));
  return wanted.length === got.length && wanted.every((cell, i) => cell === got[i]);
};

/** Which positions differ, cell by cell — for highlighting a wrong row rather
 *  than just naming it wrong. Compared position by position with no trimming,
 *  so a box the learner left filled in when it should have emptied still
 *  shows as the one that is off. */
export const cellDiffs = (
  expected: string[],
  given: string[],
  caseSensitive: boolean,
): boolean[] => {
  const length = Math.max(expected.length, given.length);
  return Array.from(
    { length },
    (_, i) =>
      normaliseCell(expected[i] ?? "", caseSensitive) !==
      normaliseCell(given[i] ?? "", caseSensitive),
  );
};

export type RowState = "correct" | "wrong";

export type StepState = {
  state: RowState;
  /** Per-cell, for a wrong row: which boxes do not match. */
  diffs: boolean[];
};

/** Every step, with the row it is judged against — the learner's own where
 *  they touched it, carried forward from before where they have not. */
export const stepStates = (data: Data, answer: Answer | undefined): StepState[] =>
  data.steps.map((step, index) => {
    const given = carryForward(data, answer, index);
    const correct = rowCorrect(step.expected, given, data.caseSensitive);
    return {
      state: correct ? "correct" : "wrong",
      diffs: cellDiffs(step.expected, given, data.caseSensitive),
    };
  });

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

  const states = stepStates(data, answer);
  const total = states.length;
  const correctCount = states.filter((step) => step.state === "correct").length;
  const allCorrect = total > 0 && correctCount === total;

  // All or nothing when the author says so, and when there is nothing to
  // count: a task with no steps would otherwise be scored out of zero.
  const score =
    data.partialCredit && total > 0
      ? { earned: correctCount, possible: total }
      : { earned: allCorrect ? 1 : 0, possible: 1 };

  return {
    state: allCorrect ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      rows: states.map((step) => step.state),
      diffs: states.map((step) => step.diffs),
    },
  };
};
