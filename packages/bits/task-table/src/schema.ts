import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A table with some cells given and some left blank for the learner to fill
 * in, marked cell by cell.
 *
 * One bit rather than several, because "predict the result of this query",
 * "fill in the value table", "complete the confusion matrix" and "copy this
 * formula down the column" are all the same shape of question: a grid the
 * author mostly wrote, with holes in it. What differs is only what a filled
 * cell is compared against — text, a number within a tolerance, or a
 * spreadsheet formula normalised the way a spreadsheet would read it — which
 * is why that lives on the *column*, not on the bit as a whole.
 */

export const COLUMN_KINDS = ["text", "number", "formula"] as const;
export const ColumnKindSchema = z.enum(COLUMN_KINDS);
export type ColumnKind = z.infer<typeof ColumnKindSchema>;

export const ColumnSchema = z.object({
  /** Stable across edits, so a cell keeps pointing at the same column. */
  id: z.string().min(1),
  header: z.string().default(""),
  kind: ColumnKindSchema.default("text"),
});
export type Column = z.infer<typeof ColumnSchema>;

/** A cell the author has already filled in. Shown as plain text, never as an input. */
export const GivenCellSchema = z.object({
  given: z.string(),
});
export type GivenCell = z.infer<typeof GivenCellSchema>;

/** A cell the learner fills in. `accepted` is every spelling that counts as right. */
export const BlankCellSchema = z.object({
  accepted: z.array(z.string()).default([]),
});
export type BlankCell = z.infer<typeof BlankCellSchema>;

/**
 * A cell is one or the other, never both. The union has no shared tag because
 * the two shapes do not overlap: reading `"given" in cell` tells them apart
 * without one.
 */
export const CellSchema = z.union([GivenCellSchema, BlankCellSchema]);
export type Cell = z.infer<typeof CellSchema>;

export const isGivenCell = (cell: Cell | undefined): cell is GivenCell =>
  cell !== undefined && "given" in cell;

export const isBlankCell = (cell: Cell | undefined): cell is BlankCell =>
  cell !== undefined && "accepted" in cell;

export const emptyGivenCell = (): GivenCell => ({ given: "" });
export const emptyBlankCell = (): BlankCell => ({ accepted: [] });

export const RowSchema = z.object({
  /** Stable across edits and across a shuffled marking pass — see `rowOrder`. */
  id: z.string().min(1),
  /** Shown only when `rowHeaders` is on. */
  header: z.string().optional(),
  /** Column id → the cell there. */
  cells: z.record(z.string(), CellSchema).default({}),
});
export type Row = z.infer<typeof RowSchema>;

/**
 * `"fixed"` — a row answers for the row it is drawn in, same as every other
 * bit here.
 *
 * `"any"` — the table's rows are marked as a multiset: a row the learner wrote
 * is compared against whichever authored row it best matches, not against the
 * one sitting at the same position. This is what a query result without
 * `ORDER BY` needs — the database is free to return its rows in any order, so
 * a correct prediction typed in a different order than the answer key must
 * still mark correct. See `matchRows` in `evaluate.ts` for how the match is
 * found.
 */
export const ROW_ORDERS = ["fixed", "any"] as const;
export const RowOrderSchema = z.enum(ROW_ORDERS);
export type RowOrder = z.infer<typeof RowOrderSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** Shown above the table. Optional — most tables need no more caption than the instruction already gives. */
    caption: z.string().default(""),
    columns: z.array(ColumnSchema).default([]),
    rows: z.array(RowSchema).default([]),
    /** Whether the first column is a heading rather than data. */
    rowHeaders: z.boolean().default(false),
    rowOrder: RowOrderSchema.default("fixed"),
    /**
     * Whether capital letters decide a mark. Off by default: a query result's
     * column is not testing spelling, and neither is a formula's function
     * name.
     */
    caseSensitive: z.boolean().default(false),
    /**
     * Whether leading/trailing space and runs of internal space are collapsed
     * before comparing. On by default — a trailing space pasted out of a
     * spreadsheet cell is not a different answer.
     */
    ignoreWhitespace: z.boolean().default(true),
    /**
     * Absolute slack allowed on a `number` cell, so `3.14159` can be accepted
     * for an answer authored as `3.14`. Zero means exact.
     */
    numberTolerance: z.number().min(0).default(0),
    /**
     * A point per blank cell rather than one for the whole table. On by
     * default, because a table that gets three of four cells right did get
     * three of four cells right.
     */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { columns, rows, evaluation } = ctx.value;

    const columnIds = columns.map((column) => column.id);
    if (new Set(columnIds).size !== columnIds.length) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Each column needs its own id.",
      });
    }

    const rowIds = rows.map((row) => row.id);
    if (new Set(rowIds).size !== rowIds.length) {
      ctx.issues.push({
        code: "custom",
        input: rows,
        path: ["rows"],
        message: "Each row needs its own id.",
      });
    }

    // A row missing a cell for a column cannot be rendered as the table it is
    // meant to be — every rendered position needs *something* there, given or
    // blank — so this holds regardless of whether the task is graded.
    rows.forEach((row, rowIndex) => {
      for (const column of columns) {
        if (row.cells[column.id] === undefined) {
          ctx.issues.push({
            code: "custom",
            input: row,
            path: ["rows", rowIndex, "cells", column.id],
            message: `“${row.header || `Row ${rowIndex + 1}`}” has no entry for “${
              column.header || `Column ${columns.indexOf(column) + 1}`
            }”.`,
          });
        }
      }
    });

    if (evaluation.mode !== "auto") return;

    if (columns.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Add at least one column.",
      });
    }

    if (rows.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: rows,
        path: ["rows"],
        message: "Add at least one row.",
      });
    }

    columns.forEach((column, index) => {
      if (column.header.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: column,
          path: ["columns", index, "header"],
          message: "Give the column a heading.",
        });
      }
    });

    let blanks = 0;
    rows.forEach((row, rowIndex) => {
      for (const column of columns) {
        const cell = row.cells[column.id];
        if (!isBlankCell(cell)) continue;
        blanks += 1;
        if (cell.accepted.every((answer) => answer.trim() === "")) {
          ctx.issues.push({
            code: "custom",
            input: cell,
            path: ["rows", rowIndex, "cells", column.id, "accepted"],
            message: "Give at least one accepted answer for this cell, or mark it given.",
          });
        }
      }
    });

    // A table with nothing blank in it marks everybody correct for typing
    // nothing, which is not a task.
    if (columns.length > 0 && rows.length > 0 && blanks === 0) {
      ctx.issues.push({
        code: "custom",
        input: rows,
        path: ["rows"],
        message: "Leave at least one cell blank for the learner to fill in.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

/** Row id + column id → what the learner wrote. */
export const cellKey = (rowId: string, columnId: string): string => `${rowId}:${columnId}`;

export const AnswerSchema = z.object({
  cells: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** What the learner has typed into one displayed cell. */
export const answerCell = (
  answer: Answer | undefined,
  rowId: string,
  columnId: string,
): string => answer?.cells?.[cellKey(rowId, columnId)] ?? "";

/** The cell with `value` written into it, without disturbing the others. */
export const withAnswerCell = (
  answer: Answer | undefined,
  rowId: string,
  columnId: string,
  value: string,
): Answer => ({
  cells: { ...answer?.cells, [cellKey(rowId, columnId)]: value },
});

/** A given cell's text, or a blank cell's first accepted answer — for showing the answer key as answered text. */
export const cellAsText = (cell: Cell | undefined): string =>
  isGivenCell(cell) ? cell.given : (cell?.accepted[0] ?? "");

/** `accepted` joined the way the authoring form edits it, and parses it back from. */
export const ACCEPTED_SEPARATOR = " | ";

export const acceptedToText = (accepted: string[]): string => accepted.join(ACCEPTED_SEPARATOR);

/**
 * The inverse. No escaping: a `|` cannot be part of an accepted answer, which
 * is the trade for a plain one-line field instead of a list editor per cell —
 * documented on the field itself in `formMessages.ts`.
 */
export const textToAccepted = (text: string): string[] =>
  text
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part !== "");

/** A fresh id that will not collide with one already in use. */
export const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** A row with a blank cell for every column, ready to append. */
export const blankRow = (columns: Column[], id: string): Row => ({
  id,
  cells: Object.fromEntries(columns.map((column) => [column.id, emptyBlankCell()])),
});
