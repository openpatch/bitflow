import {
  defaultEvaluation,
  EvaluationSchema,
  FeedbackMessageSchema,
} from "@bitflow/core";
import { z } from "zod";
import { parseQuantity, type DecimalSeparator } from "./expression";

/**
 * A number, or a small expression that works out to one, checked against what
 * the author expects.
 *
 * The difference between this and `task-input` with a pattern is that the
 * comparison is arithmetic rather than textual: `0.5`, `.5`, `1/2` and `50e-2`
 * are one answer, and `3.14159` is or is not `pi` depending on a tolerance the
 * author sets rather than on how many characters match. A teacher who wants
 * "any of these three spellings" wants `task-input`; a teacher who wants
 * "within 2%" wants this.
 *
 * Everything is decided in the browser from the authored data and the typed
 * text. There is no answer key to fetch and nothing here evaluates code: the
 * grammar in `expression.ts` is hand-parsed and cannot express anything but
 * arithmetic.
 */

/** How close is close enough. */
export const ToleranceModeSchema = z.enum([
  /** The same number, up to floating-point noise. */
  "exact",
  /** Within a fixed distance: ±0.5 g. */
  "absolute",
  /** Within a share of the expected value: ±2%. */
  "percent",
  /** Equal once both are rounded to a number of decimal places. */
  "decimals",
  /** Equal once both are rounded to a number of significant figures. */
  "significant",
]);
export type ToleranceMode = z.infer<typeof ToleranceModeSchema>;

/** What the task does about units. */
export const UnitModeSchema = z.enum([
  /** No unit is involved; anything trailing the number is a mistake. */
  "none",
  /** The unit is printed beside the box, and the learner need not type it. */
  "shown",
  /** The learner has to supply it, and it has to be right. */
  "required",
]);
export type UnitMode = z.infer<typeof UnitModeSchema>;

/** What earns the marks. */
export const ScoringSchema = z.enum(["value", "valueAndUnit"]);
export type Scoring = z.infer<typeof ScoringSchema>;

export const DecimalSeparatorSchema = z.enum(["point", "comma", "both"]);

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * What the answer should come to, written as a number or an expression.
     *
     * An expression, so an author can write `2*pi*0.35` and let the task do
     * the arithmetic rather than pasting in a rounded decimal and then
     * wondering why the tolerance has to be so wide.
     */
    expected: z.string().default(""),
    tolerance: ToleranceModeSchema.default("exact"),
    /** The ± for `absolute`, or the percentage for `percent`. */
    toleranceValue: z.number().min(0).default(0),
    /** Places for `decimals`, figures for `significant`. */
    digits: z.number().int().min(0).max(10).default(2),
    unitMode: UnitModeSchema.default("none"),
    /** The unit as the author writes it, e.g. `m/s^2`. */
    unit: z.string().default(""),
    /** Other spellings that count, one per line in the form. */
    unitAlternatives: z.array(z.string()).default([]),
    scoring: ScoringSchema.default("value"),
    decimalSeparator: DecimalSeparatorSchema.default("both"),
    /**
     * Whether the learner may answer with arithmetic rather than a number.
     * Off, `3/4` is refused instead of quietly worked out — "give it as a
     * decimal" is a real question and answering it with the division dodges it.
     */
    allowExpression: z.boolean().default(true),
    /**
     * Feedback for particular wrong answers — the classic slip, the
     * unconverted unit, the factor of ten. Matched with the same tolerance as
     * the right answer, so `9.8` catches `9.81` when the tolerance says it
     * should.
     */
    valueFeedback: z
      .array(
        z.object({
          value: z.string().default(""),
          feedback: FeedbackMessageSchema,
        }),
      )
      .default([]),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const data = ctx.value;
    if (data.evaluation.mode !== "auto") return;

    const parsed = parseQuantity(data.expected, {
      decimalSeparator: data.decimalSeparator as DecimalSeparator,
      // The author is allowed the whole grammar even when the learner is not:
      // `2*pi` is a fine way to say what the answer comes to.
      allowExpression: true,
    });

    if (!parsed.ok) {
      ctx.issues.push({
        code: "custom",
        input: data.expected,
        path: ["expected"],
        message:
          parsed.error === "empty"
            ? "Enter the answer you expect, or switch grading off for this task."
            : "This is not a number or an expression the task can work out.",
      });
    } else if (parsed.unit !== "") {
      // Silently ignoring it would mark every learner wrong against a value
      // that is not the one on screen.
      ctx.issues.push({
        code: "custom",
        input: data.expected,
        path: ["expected"],
        message: `Leave the unit out of the expected value — “${parsed.unit}” belongs in the unit field.`,
      });
    }

    if (data.unitMode !== "none" && data.unit.trim() === "") {
      ctx.issues.push({
        code: "custom",
        input: data.unit,
        path: ["unit"],
        message: "Enter the unit, or set this task to have no unit.",
      });
    }

    // A mark nobody can earn: the unit is only worth a point when the learner
    // is the one who has to supply it.
    if (data.scoring === "valueAndUnit" && data.unitMode !== "required") {
      ctx.issues.push({
        code: "custom",
        input: data.scoring,
        path: ["scoring"],
        message:
          "The unit can only be worth a mark when the learner has to type it. Ask for the unit, or score the value only.",
      });
    }

    if (
      (data.tolerance === "absolute" || data.tolerance === "percent") &&
      data.toleranceValue <= 0
    ) {
      ctx.issues.push({
        code: "custom",
        input: data.toleranceValue,
        path: ["toleranceValue"],
        message:
          "A tolerance of nothing is the same as asking for an exact answer. Enter a tolerance, or choose exact.",
      });
    }

    if (data.tolerance === "significant" && data.digits < 1) {
      ctx.issues.push({
        code: "custom",
        input: data.digits,
        path: ["digits"],
        message: "An answer has at least one significant figure.",
      });
    }

    data.valueFeedback.forEach((entry, index) => {
      if (
        !parseQuantity(entry.value, {
          decimalSeparator: data.decimalSeparator as DecimalSeparator,
          allowExpression: true,
        }).ok
      ) {
        ctx.issues.push({
          code: "custom",
          input: entry.value,
          path: ["valueFeedback", index, "value"],
          message: "This is not a number the task can compare against.",
        });
      }
    });
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * Exactly what the learner typed.
   *
   * The raw text and nothing else. The number it comes to and the unit it
   * carries are both derived, and derived is where they stay: a stored copy is
   * a second version of the truth that can disagree with the box on screen
   * after a reload or an edit to the separator setting. The reading the score
   * used travels with the result instead, in `detail`, which is what the
   * report and a reviewer read.
   */
  input: z.string().default(""),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Every spelling of the unit that counts as right. */
export const acceptedUnits = (data: Data): string[] =>
  [data.unit, ...data.unitAlternatives]
    .map((unit) => unit.trim())
    .filter((unit) => unit !== "");
