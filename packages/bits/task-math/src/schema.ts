import {
  defaultEvaluation,
  EvaluationSchema,
  FeedbackMessageSchema,
} from "@bitflow/core";
import { z } from "zod";

/**
 * Maths written as maths, and compared as maths.
 *
 * `task-numeric` asks for a number and marks it arithmetically. This asks for
 * an *expression* — a fraction, a power, a radical, a factorised quadratic —
 * and marks it symbolically: `2x`, `2\cdot x` and `x\cdot 2` are one answer,
 * and so are `\frac{1}{2}` and `0.5`. Neither is a special case anybody wrote
 * down; they fall out of comparing what the two expressions *mean*.
 *
 * The learner writes it in a MathLive field, which is the other half of the
 * point. A fraction typed into a text box is `(a+b)/(c+d)` and a fraction
 * written as a fraction is a fraction, and only one of those is the notation
 * being taught.
 *
 * Both shapes live here because they are the same task:
 *
 * - No `\placeholder` in the template — the whole field is editable, and there
 *   is one answer, under the reserved name `answer`.
 * - One or more `\placeholder[name]{}` — the template is read-only apart from
 *   the blanks, and each blank is marked on its own.
 *
 * The second is MathLive's own fill-in-the-blank, and it is a different thing
 * from `task-fill-in-the-blank`: that one is prose with gaps in it, matched as
 * text. This is one formula with gaps in it, matched as maths.
 */

/** The blank a template with no `\placeholder` in it has exactly one of. */
export const SINGLE_BLANK = "answer";

/**
 * How two expressions are decided to be the same.
 *
 * Three, because three different questions get asked and they want different
 * answers. The names are the question, not the algorithm.
 */
export const CompareModeSchema = z.enum([
  /**
   * The same expression, however it is written. `2x`, `x\cdot 2` and `2\times x`
   * match, and so do `\frac{2}{4}` and `\frac{1}{2}`; `2x^2+x-1` and
   * `(2x-1)(x+1)` do not. This is what "factorise it" and "differentiate it"
   * want — the *form* is the answer, so a different form is a different answer.
   */
  "symbolic",
  /**
   * Mathematically equal, however it is written. `(2x-1)(x+1)` now matches
   * `2x^2+x-1`, `\sin^2 x+\cos^2 x` matches `1`, and `\frac{x^2-1}{x-1}`
   * matches `x+1`. What "give an expression equal to this" wants — and the
   * wrong choice for "factorise it", where it would accept the question back
   * unchanged.
   */
  "equivalent",
  /**
   * By what it comes to as a number, within a tolerance. For "how much is it",
   * where nothing is left unknown.
   */
  "value",
]);
export type CompareMode = z.infer<typeof CompareModeSchema>;

/** Every `\placeholder[name]{}` in a template, in the order they appear. */
export const BLANK_PATTERN = /\\placeholder\[([A-Za-z0-9_-]+)\]/g;

export const blankNamesIn = (latex: string): string[] => {
  const names: string[] = [];
  for (const match of latex.matchAll(BLANK_PATTERN)) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
};

/**
 * What the learner has to fill in: the blanks, or the single whole-field
 * answer when the template has none.
 *
 * One function rather than two branches at every call site — the whole reason
 * both shapes are one bit is that everything downstream can stop caring which
 * it is looking at.
 */
export const answerNamesIn = (latex: string): string[] => {
  const blanks = blankNamesIn(latex);
  return blanks.length > 0 ? blanks : [SINGLE_BLANK];
};

export const BlankSchema = z.object({
  /** What this blank should come to, as LaTeX. */
  expected: z.string().default(""),
  /**
   * Other answers that also count, for the times the comparison cannot be
   * asked to know. `\frac{1}{2}` and `0.5` need this under `symbolic`.
   */
  accepted: z.array(z.string()).default([]),
});
export type Blank = z.infer<typeof BlankSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * The formula, as LaTeX. Empty, or without a `\placeholder`, gives one
     * editable field; with them, a read-only formula and editable blanks.
     */
    latex: z.string().default(""),
    /** Name → what it should come to. Keyed by blank, or by `answer`. */
    blanks: z.record(z.string(), BlankSchema).default({}),
    compare: CompareModeSchema.default("symbolic"),
    /**
     * How close counts, when comparing values. Nothing means exactly, up to
     * floating-point noise.
     */
    tolerance: z.number().min(0).default(0),
    /** A mark per blank rather than all-or-nothing. */
    partialCredit: z.boolean().default(true),
    /**
     * Whether the on-screen maths keyboard is offered. It is how the task is
     * answerable on a phone at all, so it is on unless the author is asking
     * for something a physical keyboard is part of.
     */
    virtualKeyboard: z.boolean().default(true),
    /** Feedback attached to particular wrong answers, per blank. */
    blankFeedback: z
      .array(
        z.object({
          blank: z.string().default(SINGLE_BLANK),
          latex: z.string().default(""),
          feedback: FeedbackMessageSchema,
        }),
      )
      .default([]),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const data = ctx.value;
    if (data.evaluation.mode !== "auto") return;

    const names = answerNamesIn(data.latex);

    for (const name of names) {
      const blank = data.blanks[name];
      if (!blank || blank.expected.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: data.blanks,
          path: ["blanks", name],
          message:
            name === SINGLE_BLANK
              ? "Enter the answer you expect."
              : `Enter what should go in the blank “${name}”.`,
        });
      }
    }

    // A blank that is set but no longer in the formula is an answer nobody can
    // give — usually a rename, and always silent without this.
    for (const name of Object.keys(data.blanks)) {
      if (!names.includes(name)) {
        ctx.issues.push({
          code: "custom",
          input: data.blanks,
          path: ["blanks", name],
          message: `There is an expected answer for “${name}”, but no such blank in the formula.`,
        });
      }
    }

    for (const [index, entry] of data.blankFeedback.entries()) {
      if (!names.includes(entry.blank)) {
        ctx.issues.push({
          code: "custom",
          input: entry.blank,
          path: ["blankFeedback", index, "blank"],
          message: `There is no blank called “${entry.blank}” in the formula.`,
        });
      }
    }

    if (data.compare !== "value" && data.tolerance > 0) {
      ctx.issues.push({
        code: "custom",
        input: data.tolerance,
        path: ["tolerance"],
        message:
          "A tolerance only means something when answers are compared by value. Compare by value, or set the tolerance to nothing.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * Blank name → the LaTeX the learner wrote in it.
   *
   * LaTeX rather than MathJSON, because LaTeX is what the field holds and what
   * it can be given back to resume with. The MathJSON it parses to is derived
   * at marking time, and derived is where it stays.
   */
  prompts: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Every answer accepted for a blank: the expected one and its alternatives. */
export const acceptedFor = (data: Data, name: string): string[] => {
  const blank = data.blanks[name];
  if (!blank) return [];
  return [blank.expected, ...blank.accepted]
    .map((latex) => latex.trim())
    .filter((latex) => latex !== "");
};

/** Whether the template puts blanks in a read-only formula. */
export const hasBlanks = (data: Data): boolean =>
  blankNamesIn(data.latex).length > 0;
