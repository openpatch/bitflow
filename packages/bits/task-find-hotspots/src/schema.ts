import { defaultEvaluation, EvaluationSchema, ImageSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Modelled on H5P's Image Hotspot Question: a picture, some regions over it,
 * and one click.
 *
 * The learner picks a single spot and that is the answer — the task is worth
 * one mark, not one per region. Several regions may be correct, any one of
 * which wins; the rest exist to be wrong in a useful way, each able to say why.
 */

/** A fraction of the picture's width or height. Never pixels — see the README. */
const Fraction = z.number().min(0).max(1);

export const HotspotSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same region. */
  id: z.string().min(1),
  /**
   * A rectangle, or the ellipse drawn inside it. Both are placed by the same
   * four numbers, which is what lets the editor draw either by dragging.
   */
  shape: z.enum(["rect", "ellipse"]).default("rect"),
  x: Fraction,
  y: Fraction,
  width: Fraction,
  height: Fraction,
  /** Whether finding this one is the point. Several may be. */
  correct: z.boolean().default(false),
  /**
   * Shown once this region has been chosen. On a wrong region this is where
   * the teaching happens — "that is the monitor, not an input device" is worth
   * more than a red cross.
   */
  feedback: z.string().optional(),
  /**
   * Names the region for someone who cannot see the picture. Never drawn, and
   * never read out before the answer: it says where things are.
   */
  label: z.string().default(""),
});
export type Hotspot = z.infer<typeof HotspotSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    background: ImageSchema.default({ src: "", alt: "" }),
    /** The shape of the picture, so the regions keep their proportions. */
    size: z
      .object({
        width: z.number().positive().default(620),
        height: z.number().positive().default(310),
      })
      .default({ width: 620, height: 310 }),
    hotspots: z.array(HotspotSchema).default([]),
    /** Shown when the learner picks a spot no region covers. */
    missFeedback: z.string().optional(),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const ids = ctx.value.hotspots.map((hotspot) => hotspot.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.hotspots,
        path: ["hotspots"],
        message: "Each region needs its own id.",
      });
    }

    if (ctx.value.background.src && !ctx.value.background.alt.trim()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.background,
        path: ["background", "alt"],
        message: "Describe the image. Learners using a screen reader have only this.",
      });
    }

    ctx.value.hotspots.forEach((hotspot, index) => {
      if (hotspot.x + hotspot.width > 1 || hotspot.y + hotspot.height > 1) {
        ctx.issues.push({
          code: "custom",
          input: hotspot,
          path: ["hotspots", index],
          message: "This region runs off the edge of the picture.",
        });
      }
      if (!hotspot.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: hotspot,
          path: ["hotspots", index, "label"],
          message:
            "Name this region. It is never shown, but it is how the region is described to someone who cannot see the picture.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (!ctx.value.background.src) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.background,
        path: ["background", "src"],
        message: "Choose a picture. There is nothing to search without one.",
      });
    }

    const correct = ctx.value.hotspots.filter((hotspot) => hotspot.correct);
    if (correct.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.hotspots,
        path: ["hotspots"],
        message:
          "Mark at least one region as the one to find, or switch grading off for this task.",
      });
    }

    // Every region correct means every click on a region wins, and the only
    // wrong answer is missing entirely.
    if (
      ctx.value.hotspots.length > 1 &&
      correct.length === ctx.value.hotspots.length
    ) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.hotspots,
        path: ["hotspots"],
        message:
          "Every region is correct, so any of them wins. Add regions that are not, to catch the mistakes worth catching.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * Where the learner chose, and which region that turned out to be.
   *
   * The raw point is kept because it is the only record of a choice that hit
   * nothing, and because "they clicked just left of the keyboard" is a
   * different conversation from "they got it wrong".
   */
  selection: z
    .object({
      x: Fraction,
      y: Fraction,
      hotspotId: z.string().optional(),
    })
    .optional(),
});
export type Answer = z.infer<typeof AnswerSchema>;
