import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * The values a learner places by hand: a fraction, a decimal, a root, a
 * negative number. From the rational-numbers and square-roots chapters, where
 * "where does this sit on the line" is the whole of the question — the
 * axis is the working, not just the answer box.
 */

export const SNAP_MODES = ["none", "minor", "major"] as const;
export const SnapModeSchema = z.enum(SNAP_MODES);
export type SnapMode = z.infer<typeof SnapModeSchema>;

export const ItemSchema = z.object({
  /** Stable across edits, so a placed marker and an answer keep pointing at
   *  the same item even after the author reorders the list. */
  id: z.string().min(1),
  /** What the chip and the marker show — plain text, e.g. "3/4" or "√2". Not
   *  parsed: it is only ever displayed, never read back into arithmetic. */
  label: z.string().min(1),
  /** The correct position, in the line's own units — never a fraction of the
   *  line's length. The author types an expression in the form ("3/4",
   *  "sqrt(2)"); this is always the evaluated number. */
  value: z.number(),
  /** Overrides `tolerance` for this one item — a harder root among easier
   *  fractions, say. Absent means the line's own tolerance applies. */
  tolerance: z.number().min(0).optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** The line's extent, in its own units. */
    min: z.number().default(-2),
    max: z.number().default(2),
    /** Spacing of the labelled ticks. Always positive: a step of zero would
     *  ask for infinitely many of them. */
    tickStep: z.number().positive().default(1),
    /** Unlabelled ticks between two major ones. Capped at 10 — past that the
     *  line reads as a smear of lines rather than a scale. */
    minorTicks: z.number().int().min(0).max(10).default(0),
    labelTicks: z.boolean().default(true),
    items: z.array(ItemSchema).default([]),
    /**
     * The absolute tolerance a placement is marked against, when an item does
     * not carry its own. Left unset here rather than given a schema-level
     * default: the sensible default is `tickStep / 4`, which no field in a
     * zod object can read off a sibling while the object is being parsed. A
     * fresh bit's `defaultData` writes that value in explicitly instead, and
     * `toleranceFor` in `evaluate.ts` falls back to the same formula for a
     * document that predates a field, or one written by hand.
     */
    tolerance: z.number().min(0).optional(),
    /** Where a placed marker actually lands. `"minor"` with no minor ticks
     *  drawn is the same as `"major"` — there is nothing finer to snap to. */
    snap: SnapModeSchema.default("minor"),
    /** A point per item instead of one for the whole line — nine of ten
     *  placed correctly is nine tenths of the mark, the same reasoning as
     *  task-point-plot's open points. */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { min, max, items } = ctx.value;

    if (max <= min) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["max"],
        message: "The line needs a maximum greater than its minimum.",
      });
    }

    if (items.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: items,
        path: ["items"],
        message: "Add at least one value for the learner to place.",
      });
    }

    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: items,
        path: ["items"],
        message: "Each value needs its own id.",
      });
    }

    // Guards the tick count, not just the density on screen: a step far
    // smaller than the range would ask `ticksFor` to build thousands of
    // lines for a form preview nobody could read anyway.
    if (max > min && (max - min) / ctx.value.tickStep > 40) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.tickStep,
        path: ["tickStep"],
        message: "That tick spacing would draw more than 40 ticks. Use a wider step.",
      });
    }

    items.forEach((item, index) => {
      if (item.value < min || item.value > max) {
        ctx.issues.push({
          code: "custom",
          input: item,
          path: ["items", index, "value"],
          message: `${item.value} is outside the line (${min} to ${max}).`,
        });
      }
    });
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Item id → where the learner placed it, in the line's own units. */
  positions: z.record(z.string(), z.number()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** `data.tolerance`, or the formula it stands in for when unset. */
export const lineTolerance = (data: Data): number => data.tolerance ?? data.tickStep / 4;

/** The tolerance a given item is actually marked against. */
export const toleranceFor = (data: Data, item: Item): number =>
  item.tolerance ?? lineTolerance(data);
