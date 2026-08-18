import type { BitResult } from "@bitflow/core";
import type { Answer, Data, PlacedLine } from "./schema";

/** The lines that belong in the finished program, in order. */
export const solutionOf = (data: Data) =>
  data.lines.filter((line) => !line.distractor);

export type LineOutcome = {
  lineId: string;
  /** Whether this line is at the position it belongs at. */
  placed: boolean;
  /** Whether its indentation is right. `undefined` when indentation is not asked for. */
  indented?: boolean;
  /** Whether it belongs in the program at all. */
  distractor: boolean;
};

/**
 * Order and indentation are judged separately, and both from the same
 * position-by-position comparison.
 *
 * A learner who has the right lines in the right order but has not seen the
 * nesting has understood most of the problem, and one point for the whole
 * puzzle would say otherwise. Keeping them apart is also what lets the task
 * say *which* half went wrong, which is the more useful thing to be told.
 */
export const outcomes = (data: Data, placed: PlacedLine[]): LineOutcome[] => {
  const solution = solutionOf(data);
  const isDistractor = (id: string) =>
    data.lines.find((line) => line.id === id)?.distractor === true;

  return placed.map((entry, index) => {
    const expected = solution[index];
    const right = expected !== undefined && expected.id === entry.lineId;
    return {
      lineId: entry.lineId,
      placed: right,
      indented: data.indentationMatters
        ? right && expected.indent === entry.indent
        : undefined,
      distractor: isDistractor(entry.lineId),
    };
  });
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

  const placed = answer?.lines ?? [];
  const marks = outcomes(data, placed);
  const solution = solutionOf(data);

  // One point per line for the order, and a second for the indentation when
  // that is part of the question.
  const perLine = data.indentationMatters ? 2 : 1;
  const possible = solution.length * perLine;

  const order = marks.filter((mark) => mark.placed).length;
  const indent = marks.filter((mark) => mark.indented === true).length;
  const strays = marks.filter((mark) => mark.distractor).length;

  const earned = Math.max(
    0,
    order + indent - (data.penaliseDistractors ? strays : 0),
  );
  const allRight = possible > 0 && earned === possible;

  return {
    state: allRight ? "correct" : "wrong",
    score: { earned, possible },
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Per line, so each can be marked where it sits, and so the task can
      // say "right order, wrong nesting" rather than only a number.
      lines: marks,
      usedDistractors: strays,
    },
  };
};
