import type { BitResult } from "@bitflow/core";
import { gridOf, pathOf, type Grid } from "./grid";
import { cellKey, normalise, type Answer, type Data } from "./schema";

/** What one square came to. */
export type CellOutcome = "correct" | "wrong" | "blank";

/** What one clue came to, and enough to say why. */
export type WordOutcome = {
  wordId: string;
  correct: boolean;
  /** Every letter typed in, right or not. A word left half-done is not wrong yet. */
  complete: boolean;
  /** Letters in the wrong place. What a penalty is charged for. */
  wrong: number;
};

export const letterAt = (answer: Answer | undefined, key: string): string =>
  normalise(answer?.letters?.[key] ?? "");

export const cellOutcome = (
  grid: Grid,
  answer: Answer | undefined,
  row: number,
  column: number,
): CellOutcome => {
  const cell = grid.cells.get(cellKey(row, column));
  if (!cell) return "blank";
  const typed = letterAt(answer, cellKey(row, column));
  if (!typed) return "blank";
  return typed === cell.solution ? "correct" : "wrong";
};

export const outcomes = (
  data: Data,
  answer: Answer | undefined,
  grid: Grid = gridOf(data),
): WordOutcome[] =>
  grid.words.map((word) => {
    const marks = pathOf(grid, word.id).map((cell) =>
      cellOutcome(grid, answer, cell.row, cell.column),
    );
    return {
      wordId: word.id,
      correct: marks.length > 0 && marks.every((mark) => mark === "correct"),
      complete: marks.every((mark) => mark !== "blank"),
      wrong: marks.filter((mark) => mark === "wrong").length,
    };
  });

/**
 * H5P's two ways of counting, kept as they are.
 *
 * By word, a word is right or it is not — which is how a crossword is
 * actually solved, and the default. By letter, every correct square counts,
 * which is kinder to a long answer with one slip in it.
 *
 * A wrong letter can cost a point; an empty square never does. That asymmetry
 * is deliberate: a learner who guesses at the last clue should not finish
 * behind one who left it blank, and a puzzle that punishes trying teaches
 * people not to try. The total is floored at zero either way, so a bad run
 * cannot eat marks earned elsewhere in the assessment.
 */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
  grid: Grid = gridOf(data),
): { earned: number; possible: number } => {
  if (data.scoring === "letters") {
    const cells = [...grid.cells.values()];
    const earned = cells.reduce((total, cell) => {
      const mark = cellOutcome(grid, answer, cell.row, cell.column);
      if (mark === "correct") return total + 1;
      if (mark === "wrong" && data.penaliseWrong) return total - 1;
      return total;
    }, 0);
    return { earned: Math.max(0, earned), possible: cells.length };
  }

  const marks = outcomes(data, answer, grid);
  const earned = marks.reduce((total, mark) => {
    if (mark.correct) return total + 1;
    if (mark.wrong > 0 && data.penaliseWrong) return total - 1;
    return total;
  }, 0);
  return { earned: Math.max(0, earned), possible: marks.length };
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

  const grid = gridOf(data);
  const marks = outcomes(data, answer, grid);
  const score = scoreOf(data, answer, grid);
  const allRight = score.possible > 0 && score.earned === score.possible;

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Per word, so each clue can be marked in the list and the grid can
      // show which squares to look at again.
      words: marks,
    },
  };
};
