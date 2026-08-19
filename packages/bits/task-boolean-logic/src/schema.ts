import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A truth table to complete.
 *
 * The author writes an expression; every row of the table is generated from
 * the variables, and every cell is worked out in the page by walking the tree.
 * Nothing is stored as an answer key, which is what makes this reliable: a
 * table cannot disagree with the expression printed above it, because the
 * table *is* the expression.
 *
 * The expression is held as a tree rather than as source. There is no `eval`
 * and no `Function` anywhere near it — see `expression.ts` for the grammar,
 * which has no way to name a global, a property or a call target.
 */

export type Expression =
  | { kind: "variable"; name: string }
  | { kind: "constant"; value: boolean }
  | { kind: "not"; value: Expression }
  | { kind: "and"; left: Expression; right: Expression }
  | { kind: "or"; left: Expression; right: Expression }
  | { kind: "xor"; left: Expression; right: Expression }
  | { kind: "implies"; left: Expression; right: Expression }
  | { kind: "iff"; left: Expression; right: Expression };

export const ExpressionSchema: z.ZodType<Expression> = z.lazy(() =>
  z.union([
    z.object({ kind: z.literal("variable"), name: z.string().min(1) }),
    z.object({ kind: z.literal("constant"), value: z.boolean() }),
    z.object({ kind: z.literal("not"), value: ExpressionSchema }),
    ...(["and", "or", "xor", "implies", "iff"] as const).map((kind) =>
      z.object({
        kind: z.literal(kind),
        left: ExpressionSchema,
        right: ExpressionSchema,
      }),
    ),
  ]),
);

export const ColumnSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same column. */
  id: z.string().min(1),
  /**
   * The heading. Left empty, the expression writes its own — which is what an
   * author usually wants, and what keeps the two from disagreeing.
   */
  label: z.string().default(""),
  expression: ExpressionSchema,
  /**
   * Filled in already, as a worked step rather than a question. A table that
   * builds up to something is taught by giving away the early columns.
   */
  given: z.boolean().default(false),
});
export type Column = z.infer<typeof ColumnSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * The input columns, in the order they are shown. Held separately from the
     * expressions so the table has a fixed left-hand side even while an author
     * is still writing the first column.
     */
    variables: z.array(z.string().min(1)).default([]),
    columns: z.array(ColumnSchema).default([]),
    /**
     * How the input side is filled in. `all` is the whole table, counting up
     * in binary, which is the conventional layout; `false-first` counts up
     * with the first variable changing slowest, which is the same thing said
     * the other way and is what most textbooks print.
     */
    rowOrder: z.enum(["standard", "reversed"]).default("standard"),
    /** A point per cell instead of one for the whole table. */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { variables, columns, evaluation } = ctx.value;

    if (new Set(variables).size !== variables.length) {
      ctx.issues.push({
        code: "custom",
        input: variables,
        path: ["variables"],
        message: "Two of the variables have the same name.",
      });
    }

    const ids = columns.map((column) => column.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Each column needs its own id.",
      });
    }

    // Eight variables is 256 rows, which is not a task anybody sets and is a
    // page nobody can read. Said as a limit rather than left to be discovered
    // when the browser stops.
    if (variables.length > 6) {
      ctx.issues.push({
        code: "custom",
        input: variables,
        path: ["variables"],
        message: `${variables.length} variables make ${2 ** variables.length} rows. Six is already sixty-four.`,
      });
    }

    columns.forEach((column, index) => {
      for (const name of namesIn(column.expression)) {
        if (variables.includes(name)) continue;
        ctx.issues.push({
          code: "custom",
          input: column,
          path: ["columns", index, "expression"],
          message: `“${name}” is not one of the variables, so this column has no value.`,
        });
      }
    });

    if (evaluation.mode !== "auto") return;

    if (variables.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: variables,
        path: ["variables"],
        message: "Add a variable. A truth table needs something to be true of.",
      });
    }

    if (columns.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message: "Add a column with an expression to work out.",
      });
    }

    // A table whose every column is filled in already asks nothing.
    if (columns.length > 0 && columns.every((column) => column.given)) {
      ctx.issues.push({
        code: "custom",
        input: columns,
        path: ["columns"],
        message:
          "Every column is filled in already, so there is nothing to answer. Leave at least one for the learner.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * Row id → column id → what the learner said, or `null` for "not yet".
   *
   * `null` rather than a missing key so a cleared cell is a cleared cell: a
   * three-state control has to be able to go back to having no answer, and an
   * absent key would be indistinguishable from a cell never rendered.
   */
  cells: z
    .record(z.string(), z.record(z.string(), z.boolean().nullable()))
    .default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Every variable an expression names, without importing the parser. */
const namesIn = (expression: Expression): string[] => {
  switch (expression.kind) {
    case "variable":
      return [expression.name];
    case "constant":
      return [];
    case "not":
      return namesIn(expression.value);
    default:
      return [...namesIn(expression.left), ...namesIn(expression.right)];
  }
};

export type Row = { id: string; inputs: Record<string, boolean> };

/**
 * Every assignment of the variables, as the rows of the table.
 *
 * Generated rather than authored. A stored list of rows is a second copy of
 * something the variables already determine, and one that goes stale the
 * moment a variable is renamed. The id is the row's own bit pattern, so it
 * survives everything except a change to the variables themselves — which
 * changes what the row *is*.
 */
export const rowsOf = (data: Data): Row[] => {
  const count = data.variables.length;
  if (count === 0 || count > 12) return [];

  return Array.from({ length: 2 ** count }, (_unused, index) => {
    const bits = data.variables.map((_name, position) => {
      // `standard` counts up with the last variable changing fastest, which is
      // how a truth table is printed.
      const shift =
        data.rowOrder === "standard" ? count - 1 - position : position;
      return (index >> shift) % 2 === 1;
    });
    return {
      id: bits.map((bit) => (bit ? "1" : "0")).join(""),
      inputs: Object.fromEntries(
        data.variables.map((name, position) => [name, bits[position]]),
      ),
    };
  });
};

/** What the learner has in one cell, or `null` for nothing yet. */
export const cellValue = (
  answer: Answer | undefined,
  rowId: string,
  columnId: string,
): boolean | null => answer?.cells?.[rowId]?.[columnId] ?? null;

/** The cell set, without disturbing the others. */
export const withCell = (
  answer: Answer | undefined,
  rowId: string,
  columnId: string,
  value: boolean | null,
): Answer => ({
  cells: {
    ...answer?.cells,
    [rowId]: { ...answer?.cells?.[rowId], [columnId]: value },
  },
});
