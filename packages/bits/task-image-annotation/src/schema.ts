import { defaultEvaluation, EvaluationSchema, ImageSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A picture, and marks the learner puts on it.
 *
 * The difference from `task-find-hotspots` is who chooses the position. There,
 * the author draws the regions and the learner picks one of them; here the
 * learner decides where the thing is, and what is judged is where they put it.
 * "Which of these is the CPU" and "mark the CPU" are different questions, and
 * the second one cannot be answered by elimination.
 *
 * The accepted regions are never drawn before the answer is in — outlining
 * them would answer the question — which leaves the usual problem of a picture
 * that cannot be seen. The answer is the same as in `task-find-hotspots`: the
 * learner aims a crosshair, and a keyboard moves a point exactly as freely as
 * a pointer does.
 */

/** A fraction of the picture's width or height. Never pixels — see the README. */
const Fraction = z.number().min(0).max(1);

export const ANNOTATION_KINDS = ["point", "rect"] as const;
export const AnnotationKindSchema = z.enum(ANNOTATION_KINDS);
export type AnnotationKind = z.infer<typeof AnnotationKindSchema>;

export const RegionSchema = z.object({
  /** Stable across edits, so an outcome keeps pointing at the same region. */
  id: z.string().min(1),
  /**
   * Where the answer is. A circle for "mark the point"; a rectangle for
   * "outline the area". Both are what *counts*, not what is asked for — the
   * learner's mark is a point or a box of their own.
   */
  kind: z.enum(["circle", "rect"]).default("circle"),
  x: Fraction,
  y: Fraction,
  /** For a circle: how far off the centre a mark may be and still count. */
  radius: z.number().min(0).max(1).default(0.05),
  /** For a rectangle. */
  width: Fraction.default(0.2),
  height: Fraction.default(0.2),
  /**
   * Names what is here. Shown once the answer is in, and used by whoever
   * cannot see the picture — so it is written for a reader, not as a key.
   */
  label: z.string().default(""),
  /**
   * Spellings the learner may write when a label is asked for. The region's
   * own `label` always counts, so this is for synonyms.
   */
  acceptedLabels: z.array(z.string()).default([]),
});
export type Region = z.infer<typeof RegionSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    background: ImageSchema.default({ src: "", alt: "" }),
    /** The shape of the picture, so the marks keep their proportions. */
    size: z
      .object({
        width: z.number().positive().default(620),
        height: z.number().positive().default(310),
      })
      .default({ width: 620, height: 310 }),
    /** What the learner places: a point, or a box they draw. */
    annotationKind: AnnotationKindSchema.default("point"),
    /**
     * How many marks they may place. Usually the number of regions, which is
     * what "mark the three inputs" means; more would let them cover the
     * picture and hit everything by accident.
     */
    maximumCount: z.number().int().min(1).default(1),
    /** Whether each mark has to be named as well as placed. */
    requireLabel: z.boolean().default(false),
    regions: z.array(RegionSchema).default([]),
    /**
     * How close a `rect` answer has to be to a `rect` region, as a fraction of
     * the two boxes' union — the Jaccard overlap. 0.5 is "half right", which
     * is about what a hand-drawn box round the same object comes to.
     */
    overlap: z.number().min(0).max(1).default(0.5),
    /**
     * Whether a mark that matches no region costs a point. Off by default:
     * placing the right marks is already the thing being rewarded, and
     * charging for a stray one makes the task about caution.
     */
    penaliseExtras: z.boolean().default(false),
    caseSensitive: z.boolean().default(false),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { regions, background, maximumCount, evaluation } = ctx.value;

    const ids = regions.map((region) => region.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: regions,
        path: ["regions"],
        message: "Each region needs its own id.",
      });
    }

    if (background.src && !background.alt.trim()) {
      ctx.issues.push({
        code: "custom",
        input: background,
        path: ["background", "alt"],
        message: "Describe the image. Learners using a screen reader have only this.",
      });
    }

    regions.forEach((region, index) => {
      if (!region.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: region,
          path: ["regions", index, "label"],
          message:
            "Name this region. It is how the answer is described afterwards, and how it is described to someone who cannot see the picture.",
        });
      }
      if (
        region.kind === "rect" &&
        (region.x + region.width > 1 || region.y + region.height > 1)
      ) {
        ctx.issues.push({
          code: "custom",
          input: region,
          path: ["regions", index],
          message: "This region runs off the edge of the picture.",
        });
      }
      if (region.kind === "circle" && region.radius === 0) {
        ctx.issues.push({
          code: "custom",
          input: region,
          path: ["regions", index, "radius"],
          message:
            "A region with no size can never be hit. Give it a distance a mark may be out by.",
        });
      }
    });

    if (evaluation.mode !== "auto") return;

    if (!background.src) {
      ctx.issues.push({
        code: "custom",
        input: background,
        path: ["background", "src"],
        message: "Choose a picture. There is nothing to mark without one.",
      });
    }

    if (regions.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: regions,
        path: ["regions"],
        message:
          "Add the region the mark has to land in, or switch grading off for this task.",
      });
    }

    // Fewer marks than regions makes a task nobody can finish.
    if (regions.length > maximumCount) {
      ctx.issues.push({
        code: "custom",
        input: maximumCount,
        path: ["maximumCount"],
        message: `There are ${regions.length} regions but only ${maximumCount} mark(s) allowed, so the task cannot be completed.`,
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnnotationSchema = z.object({
  /** Stable while the learner works, so a mark can be moved and removed. */
  id: z.string().min(1),
  kind: AnnotationKindSchema.default("point"),
  x: Fraction,
  y: Fraction,
  /** Only for a `rect` mark. */
  width: Fraction.default(0),
  height: Fraction.default(0),
  label: z.string().default(""),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const AnswerSchema = z.object({
  annotations: z.array(AnnotationSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** What one region came to, carried in the result so the view can say why. */
export type RegionOutcome = {
  regionId: string;
  label: string;
  /** The mark that matched it, if any. */
  annotationId?: string;
  /** Placed in the right spot but named wrongly — worth saying separately. */
  labelWrong?: boolean;
};
