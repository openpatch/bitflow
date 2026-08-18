import type { BitResult } from "@bitflow/core";
import {
  cellsBetween,
  cellsOf,
  lettersOf,
  type Answer,
  type Data,
  type Selection,
  type Word,
} from "./schema";

/** A path as one comparable string. */
const pathOf = (cells: { row: number; column: number }[]): string =>
  cells.map((cell) => `${cell.row},${cell.column}`).join(">");

/**
 * The word a selection found, if any.
 *
 * Judged on where the learner dragged rather than on what the letters spell,
 * which is what lets two words share letters, lets the same word be hidden
 * twice, and stops a filler letter that happens to complete a word being
 * marked wrong.
 *
 * Either way along the run counts. Reading a word backwards is the same
 * discovery as reading it forwards; asking people to guess which end the
 * author started at is not part of the exercise.
 */
export const wordFound = (data: Data, selection: Selection): Word | undefined => {
  const cells = cellsBetween(selection);
  if (!cells) return undefined;
  const drawn = pathOf(cells);
  const backwards = pathOf([...cells].reverse());

  return data.words.find((word) => {
    if (lettersOf(word.text).length < 2) return false;
    const own = pathOf(cellsOf(word));
    return own === drawn || own === backwards;
  });
};

/** The words found, each counted once however many times it was drawn. */
export const foundWords = (data: Data, answer: Answer | undefined): Word[] => {
  const found = new Map<string, Word>();
  for (const selection of answer?.found ?? []) {
    const word = wordFound(data, selection);
    if (word) found.set(word.id, word);
  }
  return [...found.values()];
};

export type WordOutcome = { wordId: string; found: boolean };

export const outcomes = (data: Data, answer: Answer | undefined): WordOutcome[] => {
  const found = new Set(foundWords(data, answer).map((word) => word.id));
  return data.words.map((word) => ({ wordId: word.id, found: found.has(word.id) }));
};

/**
 * A point per word found, and nothing taken away for a wrong drag.
 *
 * H5P's rule, and the right one: dragging across the grid is how the question
 * is *read*, not only how it is answered, and charging for looking would make
 * the task about caution rather than about finding.
 */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => ({
  earned: foundWords(data, answer).length,
  possible: data.words.filter((word) => lettersOf(word.text).length > 1).length,
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

  const score = scoreOf(data, answer);
  const allRight = score.possible > 0 && score.earned === score.possible;

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Per word, so the list can show which are still out there.
      words: outcomes(data, answer),
    },
  };
};
