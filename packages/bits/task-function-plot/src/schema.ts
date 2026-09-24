import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";
import { describeFormulaError, evaluateFormulaAt } from "./formula";
import { defaultHandles } from "./plot";

/**
 * A coordinate system the learner sketches a function into, one x position at
 * a time: a fixed set of "handles", each dragged (or typed, or nudged with
 * the keyboard) to the y the learner thinks the function takes there. Unlike
 * task-point-plot's classification, the mark is a distance rather than a
 * match — "how close is this handle to the target function here" — so a
 * slightly-off parabola still earns most of its points, and a handle nobody
 * touched earns none of them. It covers "draw f(x) = 2x − 1", "sketch f′ for
 * the f shown above", and "draw the parabola with vertex (1, −2)".
 *
 * The author writes `target` (and any `shown` reference curve) as arithmetic —
 * `0.5x^2 - 2` — never as code. `parseExpression` from `@bitflow/core` is a
 * hand-written grammar with no `eval`, covering +, −, ×, ÷, ^, a short list of
 * named functions and constants, and — because `x` is given as a variable —
 * implicit multiplication, so `3x` and `2(x + 1)` read the way they are
 * written on paper.
 */

export const AxisSchema = z
  .object({
    label: z.string().default(""),
    min: z.number().default(-5),
    max: z.number().default(5),
    /** Spacing between grid lines and tick labels, in axis units. On the y
     *  axis it is also the unit a "grid" or "half" snap rounds to, and the
     *  default tolerance is half of it. */
    step: z.number().positive().default(1),
  })
  // `prefault` rather than `default`: an author who gives only `label` still
  // gets the other three fields' own defaults, instead of the whole axis
  // being replaced by one where even the label is gone.
  .prefault({});
export type Axis = z.infer<typeof AxisSchema>;

export const AxesSchema = z.object({ x: AxisSchema, y: AxisSchema }).prefault({});
export type Axes = z.infer<typeof AxesSchema>;

export const SNAPS = ["none", "grid", "half"] as const;
export const SnapSchema = z.enum(SNAPS);
export type Snap = z.infer<typeof SnapSchema>;

export const ShownCurveSchema = z.object({
  /** A function of x, read the same way as `target`. Never scored, and never
   *  required to stay inside the y‑axis — it is drawn for reference (the `f`
   *  a "sketch f′" question is asked about, say), so it is clipped to the
   *  plot rather than kept from leaving it. */
  expression: z.string().default(""),
  label: z.string().default(""),
});
export type ShownCurve = z.infer<typeof ShownCurveSchema>;

/** More than this and the plot is a fence, not a sketch. */
const MAX_HANDLES = 15;

const RawDataSchema = z.object({
  instruction: z.string().default(""),
  axes: AxesSchema,
  /** The function of x the learner is meant to sketch. */
  target: z.string().default("0"),
  /** Curves drawn for reference and never scored — the `f` alongside a
   *  question about `f′`, say. */
  shown: z.array(ShownCurveSchema).default([]),
  /** The x positions the learner sets a value at. */
  handles: z.array(z.number()).default([]),
  /** How far from the target, in y units, still counts as right. */
  tolerance: z.number().min(0).optional(),
  snap: SnapSchema.default("half"),
  /** A point per handle instead of one for the whole plot — the same
   *  reasoning, and the same name, as task-point-plot's flag. */
  partialCredit: z.boolean().default(true),
  evaluation: EvaluationSchema.default(defaultEvaluation),
});

/**
 * Fills in the two fields a plain per-field `default` cannot express, because
 * each depends on a sibling that has only just finished being parsed:
 *
 * - `handles`, left empty (including simply left out of the document), becomes
 *   five positions evenly spread across the x‑axis.
 * - `tolerance`, left unset, becomes half the y‑axis's own step.
 *
 * A `.transform` rather than zod's `.overwrite` (which task-point-plot's
 * sibling fields never needed): `overwrite` keeps the schema's existing output
 * type, which would leave `tolerance` typed as possibly `undefined` forever
 * even though this always resolves it to a number. The exported `Data` type
 * below is exactly what this returns.
 */
export const DataSchema = RawDataSchema.transform((data) => ({
  ...data,
  handles: data.handles.length > 0 ? data.handles : defaultHandles(data.axes.x),
  tolerance: data.tolerance ?? data.axes.y.step / 2,
})).check((ctx) => {
  const { axes, handles, target, shown, evaluation } = ctx.value;

  if (axes.x.max <= axes.x.min) {
    ctx.issues.push({
      code: "custom",
      input: axes.x,
      path: ["axes", "x", "max"],
      message: "The x‑axis needs a maximum greater than its minimum.",
    });
  }
  if (axes.y.max <= axes.y.min) {
    ctx.issues.push({
      code: "custom",
      input: axes.y,
      path: ["axes", "y", "max"],
      message: "The y‑axis needs a maximum greater than its minimum.",
    });
  }

  if (handles.length > MAX_HANDLES) {
    ctx.issues.push({
      code: "custom",
      input: handles,
      path: ["handles"],
      message: `No more than ${MAX_HANDLES} handles — a plot this dense is unreadable.`,
    });
  }
  if (new Set(handles).size !== handles.length) {
    ctx.issues.push({
      code: "custom",
      input: handles,
      path: ["handles"],
      message: "Each handle needs its own x position.",
    });
  }
  handles.forEach((x, index) => {
    if (x < axes.x.min || x > axes.x.max) {
      ctx.issues.push({
        code: "custom",
        input: x,
        path: ["handles", index],
        message: `${x} is outside the x‑axis (${axes.x.min} to ${axes.x.max}).`,
      });
    }
  });

  // Whether the target (and any shown curve) actually evaluates only matters
  // once the task is graded — a "skip" task can leave the plot half-drawn
  // while it is being laid out, on the same reasoning task-point-plot uses to
  // leave its classes optional in that mode.
  if (evaluation.mode !== "auto") return;

  // One issue per problem, not one per handle: the field is the same text
  // whichever handle exposed the problem, so only the first is reported.
  let sawTargetSyntaxError = false;
  let sawTargetRangeError = false;
  for (const x of handles) {
    const result = evaluateFormulaAt(target, x);
    if (!result.ok) {
      if (!sawTargetSyntaxError) {
        sawTargetSyntaxError = true;
        ctx.issues.push({
          code: "custom",
          input: target,
          path: ["target"],
          message: describeFormulaError(result.error),
        });
      }
      continue;
    }
    if (!sawTargetRangeError && (result.value < axes.y.min || result.value > axes.y.max)) {
      sawTargetRangeError = true;
      ctx.issues.push({
        code: "custom",
        input: target,
        path: ["target"],
        message: `At x = ${x} the target comes to ${result.value}, which is outside the y‑axis (${axes.y.min} to ${axes.y.max}).`,
      });
    }
  }

  shown.forEach((curve, index) => {
    for (const x of handles) {
      const result = evaluateFormulaAt(curve.expression, x);
      if (!result.ok) {
        ctx.issues.push({
          code: "custom",
          input: curve.expression,
          path: ["shown", index, "expression"],
          message: describeFormulaError(result.error),
        });
        break;
      }
      // Deliberately no range check here: a shown curve may leave the y‑axis
      // (see `ShownCurveSchema`), so only whether it evaluates at all matters.
    }
  });
});

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Handle x (via `handleKey` in `evaluate.ts`) → the y the learner set it
   *  to. A handle absent from this map has not been touched, and is scored as
   *  wrong rather than as whatever default position it is drawn at. */
  values: z.record(z.string(), z.number()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;
