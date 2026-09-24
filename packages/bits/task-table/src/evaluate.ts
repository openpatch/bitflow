import type { BitResult } from "@bitflow/core";
import {
  answerCell,
  cellKey,
  isBlankCell,
  type Answer,
  type Column,
  type ColumnKind,
  type Data,
  type Row,
} from "./schema";

export type CellState = "correct" | "wrong";
/** `"rowId:columnId"` of a displayed cell → whether it is right. Given cells never appear here. */
export type CellStates = Record<string, CellState>;

/**
 * The comparison settings that decide a mark. A slice of `Data` rather than
 * the whole of it, so `evaluate.ts` never has to know about columns or rows to
 * compare two strings.
 */
export type MatchOptions = Pick<Data, "caseSensitive" | "ignoreWhitespace" | "numberTolerance">;

/** A number written with a comma or a dot as its decimal separator, or nothing. */
const parseNumber = (value: string): number | undefined => {
  const trimmed = value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return undefined;
  return Number(trimmed);
};

const normaliseText = (value: string, caseSensitive: boolean, ignoreWhitespace: boolean): string => {
  const collapsed = ignoreWhitespace ? value.trim().replace(/\s+/g, " ") : value;
  return caseSensitive ? collapsed : collapsed.toLowerCase();
};

/**
 * `=d7*(1-$h$2)+$H6` and `=D7*(1-$H$2)+$H6` are the same formula copied to the
 * same place, spelled two ways — a cell reference and a function name are not
 * case-sensitive in any spreadsheet, and a space before an operator is not
 * part of the formula. Every space goes, unconditionally: unlike `text`, a
 * formula has no reading in which internal space is meaningful. `$` is never
 * touched, because it is the one character in a copied formula that changes
 * what the copy means — it is what tells `$H$2` apart from `H2`.
 */
const normaliseFormula = (value: string, caseSensitive: boolean): string => {
  const stripped = value.replace(/\s+/g, "");
  return caseSensitive ? stripped : stripped.toUpperCase();
};

/**
 * A cell's value, comparable to another of the same kind. Exposed on its own
 * because it is what a form or a test wants to show, separately from whether
 * two values happen to match — `numberTolerance` means two different
 * normalised numbers can still be one accepted answer, so normalising is not
 * by itself the equality check.
 */
export const normalise = (
  value: string,
  kind: ColumnKind,
  options: Pick<Data, "caseSensitive" | "ignoreWhitespace">,
): string => {
  if (kind === "formula") return normaliseFormula(value, options.caseSensitive);
  if (kind === "number") {
    const parsed = parseNumber(value);
    if (parsed !== undefined) return String(parsed);
  }
  return normaliseText(value, options.caseSensitive, options.ignoreWhitespace);
};

/**
 * Whether `given` is one of the cell's accepted spellings.
 *
 * A `number` cell compares as a number first, within `numberTolerance` — that
 * is the one case two values can match without normalising to the same
 * string. Everything else, `number` included when it fails to parse as one,
 * falls back to normalised text.
 */
export const cellCorrect = (
  accepted: string[],
  given: string,
  kind: ColumnKind,
  options: MatchOptions,
): boolean =>
  accepted.some((expected) => {
    if (kind === "number") {
      const a = parseNumber(expected);
      const b = parseNumber(given);
      if (a !== undefined && b !== undefined) {
        return Math.abs(a - b) <= options.numberTolerance;
      }
    }
    return normalise(expected, kind, options) === normalise(given, kind, options);
  });

/**
 * The Hungarian algorithm (Kuhn–Munkres), O(n³): the row-to-column assignment
 * of an n×n cost matrix with the least total cost.
 *
 * `matchRows` below needs this rather than a greedy "give each row its best
 * remaining column": greedy can hand a row its favourite column even when two
 * rows want the same one, leaving the loser with its *worst* option — see
 * `evaluate.test.ts` for a worked case where the swap the greedy choice
 * rules out scores higher overall. A table stays small enough here (rows in
 * the dozens, not thousands) that the cubic cost of doing this exactly is not
 * worth trading away for an approximation.
 *
 * The implementation is the standard potentials-based one: `u`/`v` are the
 * row/column potentials, `p[j]` is the row currently assigned to column `j`
 * (1-indexed, with `p[0]` a sentinel), and `way[j]` records the augmenting
 * path used to reach column `j` while searching for row `i`'s match.
 */
export const assignMinCost = (cost: number[][]): number[] => {
  const n = cost.length;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = -1;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const rowToColumn = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) rowToColumn[p[j] - 1] = j - 1;
  }
  return rowToColumn;
};

/** The learner's cells for one displayed row, keyed by column id. */
const learnerRow = (data: Data, answer: Answer | undefined, rowId: string): Record<string, string> =>
  Object.fromEntries(data.columns.map((column) => [column.id, answerCell(answer, rowId, column.id)]));

/** How many of `expectedRow`'s blank cells `learner` gets right. Given cells score nothing either way. */
const rowScore = (
  columns: Column[],
  expectedRow: Row,
  learner: Record<string, string>,
  options: MatchOptions,
): number => {
  let score = 0;
  for (const column of columns) {
    const cell = expectedRow.cells[column.id];
    if (!isBlankCell(cell)) continue;
    if (cellCorrect(cell.accepted, learner[column.id] ?? "", column.kind, options)) score += 1;
  }
  return score;
};

/**
 * Displayed row index → the authored row it is marked against.
 *
 * `"fixed"` is the identity: row *n* is marked against row *n*, as everywhere
 * else in bitflow. `"any"` finds the pairing that gets the most cells right in
 * total, which is the multiset comparison a query result without `ORDER BY`
 * needs — see the `RowOrder` doc in `schema.ts`. Both sides have the same
 * number of rows (the learner fills in the table the author built; they do
 * not add or remove rows), so this is exactly the square assignment problem
 * `assignMinCost` solves, with cost defined as `-score` so the least-cost
 * assignment is the one that gets the most right.
 */
export const matchRows = (data: Data, answer: Answer | undefined): number[] => {
  const { rows, columns, rowOrder } = data;
  const identity = rows.map((_, index) => index);
  if (rowOrder !== "any" || rows.length === 0) return identity;

  const learners = rows.map((row) => learnerRow(data, answer, row.id));
  const cost = rows.map((_, displayIndex) =>
    rows.map((_, expectedIndex) => -rowScore(columns, rows[expectedIndex], learners[displayIndex], data)),
  );
  return assignMinCost(cost);
};

/** Every blank cell's state, keyed by the displayed row it sits in — see `cellKey`. */
export const cellStates = (data: Data, answer: Answer | undefined): CellStates => {
  const states: CellStates = {};
  const match = matchRows(data, answer);

  data.rows.forEach((displayRow, displayIndex) => {
    const expectedRow = data.rows[match[displayIndex]];
    for (const column of data.columns) {
      const cell = expectedRow.cells[column.id];
      if (!isBlankCell(cell)) continue;
      const given = answerCell(answer, displayRow.id, column.id);
      const correct = cellCorrect(cell.accepted, given, column.kind, data);
      states[cellKey(displayRow.id, column.id)] = correct ? "correct" : "wrong";
    }
  });

  return states;
};

/** A point per blank cell that has something to get right. Given cells were never a mark to earn. */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const states = cellStates(data, answer);
  let earned = 0;
  let possible = 0;
  for (const state of Object.values(states)) {
    possible += 1;
    if (state === "correct") earned += 1;
  }
  return { earned, possible };
};

/** Whether every blank cell, under its best row match, is right. */
export const allCorrect = (data: Data, answer: Answer | undefined): boolean => {
  const states = cellStates(data, answer);
  const values = Object.values(states);
  return values.length > 0 && values.every((state) => state === "correct");
};

export const evaluate = ({ data, answer }: { data: Data; answer?: Answer }): BitResult => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const right = allCorrect(data, answer);
  const cells = scoreOf(data, answer);

  // All or nothing when the author says so, and when there is nothing to
  // count: a table with no blank cells would otherwise be scored out of zero.
  const score =
    data.partialCredit && cells.possible > 0 ? cells : { earned: right ? 1 : 0, possible: 1 };

  return {
    state: right ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { cells: cellStates(data, answer) },
  };
};
