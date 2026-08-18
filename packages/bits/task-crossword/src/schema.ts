import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A crossword: clues, their answers, and where each answer sits on the grid.
 *
 * Modelled on H5P's Crossword, with one deliberate difference. H5P lays the
 * grid out at run time from a list of words, so the same content can come out
 * differently for two learners and an author cannot see what they are setting.
 * Here the layout is worked out once, while authoring, and written into the
 * file — the same generator, run at the other end. A `.bitflow` file then
 * describes exactly one puzzle, which is what makes it reviewable, printable
 * and gradeable.
 */

export const OrientationSchema = z.enum(["across", "down"]);
export type Orientation = z.infer<typeof OrientationSchema>;

export const WordSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same word. */
  id: z.string().min(1),
  clue: z.string().default(""),
  /**
   * The letters to be filled in. Compared case-insensitively, and stored as
   * the author typed it so the solution can be shown back in their own hand.
   */
  answer: z.string().default(""),
  /** Zero-based, from the top-left of the grid. */
  row: z.number().int().min(0).default(0),
  column: z.number().int().min(0).default(0),
  orientation: OrientationSchema.default("across"),
});
export type Word = z.infer<typeof WordSchema>;

/**
 * What a filled-in letter is worth.
 *
 * `words` is H5P's default and the one that matches how a crossword is
 * actually solved: a word is right or it is not. `letters` gives credit for
 * every correct letter, which suits a long word with one slip.
 */
export const ScoringSchema = z.enum(["words", "letters"]);
export type Scoring = z.infer<typeof ScoringSchema>;

/** A letter someone typed, and where. Uppercase, so case never decides a mark. */
export const normalise = (letter: string): string =>
  letter.trim().toUpperCase().slice(0, 1);

/** The letters of an answer, in grid order, ignoring anything unusable. */
export const lettersOf = (answer: string): string[] =>
  [...answer.trim().toUpperCase()].filter((letter) => letter !== " ");

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    words: z.array(WordSchema).default([]),
    scoring: ScoringSchema.default("words"),
    /**
     * Whether a wrong letter costs a point. Off by default: a crossword
     * rewards care already, and a learner who guesses at the last clue should
     * not end up behind one who left it blank. A blank never costs anything
     * either way.
     */
    penaliseWrong: z.boolean().default(false),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { words } = ctx.value;

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
      if (!word.clue.trim()) {
        ctx.issues.push({
          code: "custom",
          input: word,
          path: ["words", index, "clue"],
          message: "Give this word a clue.",
        });
      }
      if (lettersOf(word.answer).length < 2) {
        ctx.issues.push({
          code: "custom",
          input: word,
          path: ["words", index, "answer"],
          message: "An answer needs at least two letters.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (words.length < 2) {
      ctx.issues.push({
        code: "custom",
        input: words,
        path: ["words"],
        message: "Add at least two words. One word is not a crossword.",
      });
      return;
    }

    for (const clash of clashes(words)) {
      ctx.issues.push({
        code: "custom",
        input: words,
        path: ["words", clash.index, "answer"],
        message: clash.message,
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * The letters typed in, keyed `"row,column"`. A map rather than a grid, so
   * an answer stays readable and does not have to be resized when the author
   * adds a word.
   */
  letters: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** A cell key. The one place the shape of that string is decided. */
export const cellKey = (row: number, column: number): string => `${row},${column}`;

/** Every cell a word passes through, in order. */
export const cellsOf = (word: Word): { row: number; column: number }[] =>
  lettersOf(word.answer).map((_letter, index) => ({
    row: word.row + (word.orientation === "down" ? index : 0),
    column: word.column + (word.orientation === "across" ? index : 0),
  }));

/**
 * The reasons a set of words is not a crossword: two words wanting different
 * letters in one cell, two words lying on top of each other, or a word off on
 * its own with nothing crossing it.
 *
 * Checked in the schema rather than left to the author's eye, because each of
 * these makes a puzzle that cannot be solved — and the last one makes a
 * word list wearing a grid's clothes.
 */
const clashes = (
  words: Word[],
): { index: number; message: string }[] => {
  const found: { index: number; message: string }[] = [];
  const letters = new Map<string, { letter: string; wordIndex: number }>();
  const crossings = new Map<number, Set<number>>(
    words.map((_word, index) => [index, new Set<number>()]),
  );

  words.forEach((word, index) => {
    const wanted = lettersOf(word.answer);
    cellsOf(word).forEach((cell, position) => {
      const key = cellKey(cell.row, cell.column);
      const taken = letters.get(key);
      if (!taken) {
        letters.set(key, { letter: wanted[position], wordIndex: index });
        return;
      }

      // Two words along the same line share every cell, not just one; the
      // crossing rule below would call that a crossing.
      if (words[taken.wordIndex].orientation === word.orientation) {
        found.push({
          index,
          message: `“${word.answer}” lies on top of “${words[taken.wordIndex].answer}”. Two words in the same direction cannot share cells.`,
        });
        return;
      }

      crossings.get(index)?.add(taken.wordIndex);
      crossings.get(taken.wordIndex)?.add(index);
      if (taken.letter !== wanted[position]) {
        found.push({
          index,
          message: `“${word.answer}” and “${words[taken.wordIndex].answer}” cross at row ${cell.row + 1}, column ${cell.column + 1}, but one wants ${taken.letter} and the other ${wanted[position]}.`,
        });
      }
    });
  });

  // Reachable from the first word, not merely crossed by something: two
  // pairs of words that cross each other but not the others are two
  // crosswords printed on one sheet.
  const reachable = new Set<number>([0]);
  const queue = [0];
  while (queue.length > 0) {
    for (const next of crossings.get(queue.pop() as number) ?? []) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      queue.push(next);
    }
  }
  words.forEach((word, index) => {
    if (!reachable.has(index)) {
      found.push({
        index,
        message: `“${word.answer}” cannot be reached from the other words. Every word has to cross into the rest of the grid, or it is a list of clues rather than a crossword.`,
      });
    }
  });

  // One message per word: five variations on the same misplacement is noise.
  const seen = new Set<number>();
  return found.filter((clash) => {
    if (seen.has(clash.index)) return false;
    seen.add(clash.index);
    return true;
  });
};
