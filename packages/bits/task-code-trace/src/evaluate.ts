import type { BitResult } from "@bitflow/core";
import {
  cellValue,
  type Answer,
  type CellState,
  type Data,
} from "./schema";

/**
 * A number written as a number, or nothing.
 *
 * Deliberately narrower than `Number()`, which reads `""` as zero, `"0x10"` as
 * sixteen and `"Infinity"` as a value — none of which is what a learner meant
 * to type in a trace table, and all of which would silently equal something.
 */
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

const asNumber = (value: string): number | undefined =>
  NUMBER.test(value) ? Number(value) : undefined;

/**
 * The form of a cell that decides a mark.
 *
 * Spaces around punctuation are dropped, so `[1, 2]` and `[1,2]` are one
 * answer, while the space in `hello world` is kept — inside a value it is part
 * of the value. Case is the author's choice, and off by default: `True` and
 * `true` are the same prediction about what the program does.
 */
export const normalise = (value: string, caseSensitive: boolean): string => {
  const collapsed = value.trim().replace(/\s+/g, " ");
  const tightened = collapsed
    .replace(/\s*([,;:[\]{}()])\s*/g, "$1")
    .trim();
  return caseSensitive ? tightened : tightened.toLowerCase();
};

/**
 * Whether a cell is right.
 *
 * Numbers are compared as numbers, so `6`, `6.0` and `+6` are one answer — a
 * trace is a claim about a value, not about how the value is spelled. Anything
 * else is compared as text, once normalised.
 */
export const cellCorrect = (
  expected: string,
  given: string,
  caseSensitive: boolean,
): boolean => {
  const wanted = normalise(expected, caseSensitive);
  const got = normalise(given, caseSensitive);

  const a = asNumber(wanted);
  const b = asNumber(got);
  if (a !== undefined && b !== undefined) return a === b;

  return wanted === got;
};

/** Checkpoint id → column id → whether that cell is right. */
export type CellStates = Record<string, Record<string, CellState>>;

export const cellStates = (data: Data, answer: Answer | undefined): CellStates => {
  const states: CellStates = {};

  for (const checkpoint of data.checkpoints) {
    states[checkpoint.id] = {};
    for (const column of data.columns) {
      const correct = cellCorrect(
        checkpoint.expected[column.id] ?? "",
        cellValue(answer, checkpoint.id, column.id),
        data.caseSensitive,
      );
      states[checkpoint.id][column.id] = correct ? "correct" : "wrong";
    }
  }

  return states;
};

/**
 * A point per cell that had something to get right.
 *
 * A cell the author left blank means "there is nothing here yet" — a real part
 * of a trace, and one worth reading — but it is not a mark to be earned, or a
 * table of mostly-undefined variables would pay a learner for answering none
 * of it. Writing into one is still wrong, and still shown as wrong; it just
 * moves no number, because nothing here is ever taken away.
 */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const states = cellStates(data, answer);
  let earned = 0;
  let possible = 0;

  for (const checkpoint of data.checkpoints) {
    for (const column of data.columns) {
      if ((checkpoint.expected[column.id] ?? "").trim() === "") continue;
      possible += 1;
      if (states[checkpoint.id][column.id] === "correct") earned += 1;
    }
  }

  return { earned, possible };
};

/** Whether every cell, blanks included, is as the author wrote it. */
export const allCorrect = (data: Data, answer: Answer | undefined): boolean => {
  const states = cellStates(data, answer);
  return (
    data.checkpoints.length > 0 &&
    data.columns.length > 0 &&
    data.checkpoints.every((checkpoint) =>
      data.columns.every(
        (column) => states[checkpoint.id][column.id] === "correct",
      ),
    )
  );
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
  const cells = scoreOf(data, answer);

  // All or nothing when the author says so, and when there is nothing to
  // count: a table of blanks would otherwise be scored out of zero.
  const score =
    data.partialCredit && cells.possible > 0
      ? cells
      : { earned: right ? 1 : 0, possible: 1 };

  return {
    state: right ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { cells: cellStates(data, answer) },
  };
};
