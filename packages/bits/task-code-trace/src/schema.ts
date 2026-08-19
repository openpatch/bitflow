import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A program, shown as text, and a trace table to fill in.
 *
 * The code is displayed and never executed — not by `eval`, not by `Function`,
 * not by a runner somewhere else. What makes the task gradable is that the
 * author writes down the states as well as the code, so marking is a string
 * comparison against authored data rather than a language implementation this
 * package would have to be trusted with.
 *
 * The table is the whole answer shape: columns are what is being watched, rows
 * are the moments it is watched at. "Predict the variables", "predict the
 * output" and "predict which line runs next" are all the same question asked of
 * a different kind of column, so they are one bit rather than three.
 */

/**
 * What a column watches.
 *
 * - `value` — a variable, written as it would be printed.
 * - `output` — what the program has printed *so far*, cumulative down the
 *   table, which is how output is traced by hand.
 * - `line` — which line of the program runs next, chosen from the code itself
 *   rather than typed, so the learner picks a line rather than remembering a
 *   number.
 */
export const COLUMN_KINDS = ["value", "output", "line"] as const;
export const ColumnKindSchema = z.enum(COLUMN_KINDS);
export type ColumnKind = z.infer<typeof ColumnKindSchema>;

export const ColumnSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same column. */
  id: z.string().min(1),
  /** The heading. A variable name for a `value` column. */
  name: z.string().default(""),
  kind: ColumnKindSchema.default("value"),
});
export type Column = z.infer<typeof ColumnSchema>;

export const CheckpointSchema = z.object({
  id: z.string().min(1),
  /** The row heading: "after the loop", "when i is 2", "step 3". */
  label: z.string().default(""),
  /**
   * The line the checkpoint sits at, 1-based, or omitted. Only a signpost —
   * it marks the row in the listing so the learner can see where they are.
   */
  line: z.number().int().positive().optional(),
  /** Column id → the value expected there. An empty string means "blank". */
  expected: z.record(z.string(), z.string()).default({}),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

/** The program's lines, as they are shown and numbered. */
export const linesOf = (code: string): string[] => code.replace(/\n$/, "").split("\n");

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * Names the language for the reader and for the listing's label. It picks
     * no parser and no highlighter: a language implementation per task type
     * would be a large thing to get wrong in a component that is only ever
     * meant to *show* the code.
     */
    language: z.string().default(""),
    /** Shown as text, always. */
    code: z.string().default(""),
    showLineNumbers: z.boolean().default(true),
    columns: z.array(ColumnSchema).default([]),
    checkpoints: z.array(CheckpointSchema).default([]),
    /**
     * Whether capital letters decide a mark. Off by default: `True` and `true`
     * are the same prediction about what the program does, and which spelling
     * a language prints is not what is being tested.
     */
    caseSensitive: z.boolean().default(false),
    /**
     * A point per cell rather than one for the whole table. On by default,
     * because a trace that goes wrong at step four got the first three right
     * and that is the thing worth knowing.
     */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { columns, checkpoints, code } = ctx.value;

    const columnIds = columns.map((column) => column.id);
    if (new Set(columnIds).size !== columnIds.length) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Each column needs its own id.",
      });
    }

    const checkpointIds = checkpoints.map((checkpoint) => checkpoint.id);
    if (new Set(checkpointIds).size !== checkpointIds.length) {
      ctx.issues.push({
        code: "custom",
        input: checkpoints,
        path: ["checkpoints"],
        message: "Each checkpoint needs its own id.",
      });
    }

    if (ctx.value.evaluation.mode !== "auto") return;

    if (code.trim() === "") {
      ctx.issues.push({
        code: "custom",
        input: code,
        path: ["code"],
        message: "Add the program the learner is to trace.",
      });
    }

    if (columns.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Add at least one column to trace.",
      });
    }

    if (checkpoints.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: checkpoints,
        path: ["checkpoints"],
        message: "Add at least one checkpoint.",
      });
    }

    columns.forEach((column, index) => {
      if (column.name.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: column,
          path: ["columns", index, "name"],
          message: "Give the column a heading.",
        });
      }
    });

    const lines = linesOf(code);

    checkpoints.forEach((checkpoint, index) => {
      if (checkpoint.line !== undefined && checkpoint.line > lines.length) {
        ctx.issues.push({
          code: "custom",
          input: checkpoint,
          path: ["checkpoints", index, "line"],
          message: `The program has ${lines.length} lines, so there is no line ${checkpoint.line}.`,
        });
      }

      for (const column of columns) {
        const expected = checkpoint.expected[column.id] ?? "";
        if (column.kind !== "line" || expected.trim() === "") continue;
        const line = Number(expected);
        // A `line` cell holds a line number, and one that is not in the
        // listing cannot be chosen — so it can never be answered correctly.
        if (
          !Number.isInteger(line) ||
          line < 1 ||
          line > lines.length
        ) {
          ctx.issues.push({
            code: "custom",
            input: checkpoint,
            path: ["checkpoints", index, "expected", column.id],
            message: `“${expected}” is not one of the program's ${lines.length} lines.`,
          });
        }
      }
    });

    // A table whose every cell is blank marks everybody correct for typing
    // nothing. Blank cells are meaningful — "this variable does not exist
    // yet" — but they cannot be the whole answer.
    const anything = checkpoints.some((checkpoint) =>
      columns.some((column) => (checkpoint.expected[column.id] ?? "").trim() !== ""),
    );
    if (columns.length > 0 && checkpoints.length > 0 && !anything) {
      ctx.issues.push({
        code: "custom",
        input: checkpoints,
        path: ["checkpoints"],
        message: "Fill in the values you expect; an empty table cannot be answered wrongly.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Checkpoint id → column id → what the learner wrote. */
  cells: z.record(z.string(), z.record(z.string(), z.string())).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

export type CellState = "correct" | "wrong";

/** What the learner has in one cell. */
export const cellValue = (
  answer: Answer | undefined,
  checkpointId: string,
  columnId: string,
): string => answer?.cells?.[checkpointId]?.[columnId] ?? "";

/** The cell with `value` written into it, without disturbing the others. */
export const withCell = (
  answer: Answer | undefined,
  checkpointId: string,
  columnId: string,
  value: string,
): Answer => ({
  cells: {
    ...answer?.cells,
    [checkpointId]: { ...answer?.cells?.[checkpointId], [columnId]: value },
  },
});
