import type { BitResult } from "@bitflow/core";
import { valueOf } from "./expression";
import { cellValue, rowsOf, type Answer, type Data } from "./schema";

export type CellState = "correct" | "wrong" | "blank";
/** Row id → column id → how that cell came out. */
export type CellStates = Record<string, Record<string, CellState>>;

/** What the expression says, for every cell the learner has to fill in. */
export const solutionOf = (data: Data): Record<string, Record<string, boolean>> =>
  Object.fromEntries(
    rowsOf(data).map((row) => [
      row.id,
      Object.fromEntries(
        data.columns.map((column) => [
          column.id,
          valueOf(column.expression, row.inputs),
        ]),
      ),
    ]),
  );

/**
 * The cells that are actually being asked for.
 *
 * A column the author filled in as a worked step is shown but never marked —
 * it is part of the question, and paying for it would score the learner for
 * reading.
 */
export const askedOf = (data: Data): Array<{ rowId: string; columnId: string }> =>
  rowsOf(data).flatMap((row) =>
    data.columns
      .filter((column) => !column.given)
      .map((column) => ({ rowId: row.id, columnId: column.id })),
  );

export const cellStates = (data: Data, answer?: Answer): CellStates => {
  const solution = solutionOf(data);
  const states: CellStates = {};

  for (const { rowId, columnId } of askedOf(data)) {
    const given = cellValue(answer, rowId, columnId);
    states[rowId] ??= {};
    states[rowId][columnId] =
      given === null
        ? "blank"
        : given === solution[rowId][columnId]
          ? "correct"
          : "wrong";
  }

  return states;
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

  const states = cellStates(data, answer);
  const asked = askedOf(data);
  const right = asked.filter(
    ({ rowId, columnId }) => states[rowId]?.[columnId] === "correct",
  ).length;
  const all = right === asked.length && asked.length > 0;

  return {
    state: all ? "correct" : "wrong",
    // A truth table that goes wrong in one row got the other rows right, and
    // one mark for the whole thing says otherwise. Off, it is all or nothing.
    score: data.partialCredit
      ? { earned: right, possible: asked.length }
      : { earned: all ? 1 : 0, possible: 1 },
    allowRetry: data.evaluation.enableRetry,
    detail: { cells: states },
  };
};
