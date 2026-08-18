import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A word search: a grid of letters with words hidden in it.
 *
 * Modelled on H5P's Find the Words, which builds the grid in the learner's
 * browser from a list of words. This builds it once, while authoring, and
 * writes both the grid and where each word lies into the file — so two
 * learners get the same puzzle, the author can see what they are setting, and
 * a found word is judged by where it was dragged rather than by what the
 * letters happen to spell. That last point matters more than it sounds: a
 * filler letter can spell a target word by accident, and a learner who finds
 * that one is right and would be marked wrong.
 */

/** The eight ways a word can run. */
export const DIRECTIONS = {
  east: { row: 0, column: 1 },
  west: { row: 0, column: -1 },
  south: { row: 1, column: 0 },
  north: { row: -1, column: 0 },
  southEast: { row: 1, column: 1 },
  southWest: { row: 1, column: -1 },
  northEast: { row: -1, column: 1 },
  northWest: { row: -1, column: -1 },
} as const;

export const DirectionSchema = z.enum(
  Object.keys(DIRECTIONS) as [keyof typeof DIRECTIONS],
);
export type Direction = z.infer<typeof DirectionSchema>;

export const WordSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same word. */
  id: z.string().min(1),
  /** The word to find. Compared in uppercase, so case never decides a mark. */
  text: z.string().default(""),
  /** Where its first letter sits, zero-based from the top-left. */
  row: z.number().int().min(0).default(0),
  column: z.number().int().min(0).default(0),
  direction: DirectionSchema.default("east"),
});
export type Word = z.infer<typeof WordSchema>;

/** The letters of a word, uppercase, with anything unusable dropped. */
export const lettersOf = (text: string): string[] =>
  [...text.trim().toUpperCase()].filter((letter) => letter !== " ");

/** Every cell a word passes through, in the order it is written. */
export const cellsOf = (word: Word): { row: number; column: number }[] => {
  const step = DIRECTIONS[word.direction];
  return lettersOf(word.text).map((_letter, index) => ({
    row: word.row + step.row * index,
    column: word.column + step.column * index,
  }));
};

export const cellKey = (row: number, column: number): string => `${row},${column}`;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    rows: z.number().int().min(2).max(30).default(10),
    columns: z.number().int().min(2).max(30).default(10),
    /**
     * The whole grid, row by row, as one string. Stored rather than derived:
     * the filler letters are part of the puzzle, and a puzzle that is
     * regenerated is a different puzzle.
     */
    letters: z.string().default(""),
    words: z.array(WordSchema).default([]),
    /**
     * Which runs the author allows. Kept as a setting rather than read back
     * off the words, so unticking a direction nothing happens to use still
     * means something the next time the grid is built.
     */
    directions: z
      .array(DirectionSchema)
      .default(() => Object.keys(DIRECTIONS) as Direction[]),
    /**
     * Whether the words are listed. Off, the learner is told only how many
     * there are — much harder, and the way a word search is set as a spelling
     * exercise rather than a hunting one.
     */
    showWords: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { words, rows, columns, letters } = ctx.value;

    const ids = words.map((word) => word.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: words,
        path: ["words"],
        message: "Each word needs its own id.",
      });
    }

    words.forEach((word, index) => {
      if (lettersOf(word.text).length < 2) {
        ctx.issues.push({
          code: "custom",
          input: word,
          path: ["words", index, "text"],
          message: "A word needs at least two letters.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (ctx.value.directions.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.directions,
        path: ["directions"],
        message: "Allow at least one direction for words to run in.",
      });
    }

    if (words.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: words,
        path: ["words"],
        message: "Add at least one word to find.",
      });
      return;
    }

    if (letters.length !== rows * columns) {
      ctx.issues.push({
        code: "custom",
        input: letters,
        path: ["letters"],
        message: `The grid holds ${letters.length} letters but is ${rows} by ${columns}. Lay the grid out again.`,
      });
      return;
    }

    const at = (row: number, column: number) => letters[row * columns + column];

    words.forEach((word, index) => {
      const cells = cellsOf(word);
      const off = cells.some(
        (cell) =>
          cell.row < 0 ||
          cell.column < 0 ||
          cell.row >= rows ||
          cell.column >= columns,
      );
      if (off) {
        ctx.issues.push({
          code: "custom",
          input: word,
          path: ["words", index, "text"],
          message: `“${word.text}” runs off the edge of the grid.`,
        });
        return;
      }

      // The grid is what the learner reads, so it has to be what the word
      // says. Anything else is a word that cannot be found.
      const wanted = lettersOf(word.text);
      const spelled = cells.map((cell) => at(cell.row, cell.column)).join("");
      if (spelled !== wanted.join("")) {
        ctx.issues.push({
          code: "custom",
          input: word,
          path: ["words", index, "text"],
          message: `The grid spells “${spelled}” where “${word.text}” is meant to be. Lay the grid out again.`,
        });
      }
    });
  });

export type Data = z.infer<typeof DataSchema>;

/** One straight run of cells the learner has drawn on the grid. */
export const SelectionSchema = z.object({
  row: z.number().int().min(0),
  column: z.number().int().min(0),
  endRow: z.number().int().min(0),
  endColumn: z.number().int().min(0),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const AnswerSchema = z.object({
  /**
   * What the learner has marked, as runs of cells rather than as word ids: a
   * word search is answered by pointing at the grid, and what was pointed at
   * is the thing worth recording.
   */
  found: z.array(SelectionSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** The letter at a position, or `undefined` off the grid. */
export const letterAt = (data: Data, row: number, column: number): string | undefined => {
  if (row < 0 || column < 0 || row >= data.rows || column >= data.columns) return undefined;
  return data.letters[row * data.columns + column];
};

/**
 * The cells a selection covers, or nothing if it is not a straight run.
 *
 * Straight means one of the eight directions, which is what a word search
 * allows and what stops a selection being a lucky bag of squares.
 */
export const cellsBetween = (
  selection: Selection,
): { row: number; column: number }[] | undefined => {
  const down = selection.endRow - selection.row;
  const across = selection.endColumn - selection.column;
  const length = Math.max(Math.abs(down), Math.abs(across));
  if (length === 0) return undefined;
  if (down !== 0 && across !== 0 && Math.abs(down) !== Math.abs(across)) {
    return undefined;
  }

  const step = { row: Math.sign(down), column: Math.sign(across) };
  return Array.from({ length: length + 1 }, (_cell, index) => ({
    row: selection.row + step.row * index,
    column: selection.column + step.column * index,
  }));
};
