import { defaultEvaluation, EvaluationSchema, ImageSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Modelled on H5P's Image Pair: two shuffled columns, and a point for each
 * pair the learner puts back together.
 *
 * Both sides are written out here. H5P lets the right side be omitted, which
 * quietly means "match this picture to a copy of itself" — a second mode
 * hiding in an absent field. An author who wants that can write the same thing
 * twice, and everyone else gets a model with one meaning.
 *
 * Widened to text as well as pictures, for the same reason as the ordering
 * task: matching a term to its definition is the commonest version of this,
 * and it should not need a screenshot.
 */

export const SideSchema = z.object({
  kind: z.enum(["text", "image"]).default("text"),
  /**
   * The words on the card, or — for a picture — what the picture shows. One
   * field either way, so an image can never be shipped undescribed.
   */
  label: z.string().default(""),
  image: ImageSchema.optional(),
});
export type Side = z.infer<typeof SideSchema>;

export const PairSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same pair. */
  id: z.string().min(1),
  left: SideSchema,
  right: SideSchema,
});
export type Pair = z.infer<typeof PairSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** Written as pairs; the learner is given the two columns shuffled. */
    pairs: z.array(PairSchema).default([]),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const ids = ctx.value.pairs.map((pair) => pair.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.pairs,
        path: ["pairs"],
        message: "Each pair needs its own id.",
      });
    }

    ctx.value.pairs.forEach((pair, index) => {
      for (const side of ["left", "right"] as const) {
        const value = pair[side];
        if (!value.label.trim()) {
          ctx.issues.push({
            code: "custom",
            input: value,
            path: ["pairs", index, side, "label"],
            message:
              value.kind === "image"
                ? "Describe this picture. It is the card's only name for anyone who cannot see it."
                : "Give this card some text.",
          });
        }
        if (value.kind === "image" && !value.image?.src) {
          ctx.issues.push({
            code: "custom",
            input: value,
            path: ["pairs", index, side, "image"],
            message: "Choose a picture for this card, or make it a text card.",
          });
        }
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    // With one pair there is nothing to choose between, and the answer is
    // whatever the learner does first.
    if (ctx.value.pairs.length < 2) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.pairs,
        path: ["pairs"],
        message: "Add at least two pairs. With one there is nothing to match.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const MatchSchema = z.object({
  /** The pair the left card came from. */
  leftId: z.string().min(1),
  /** The pair the right card came from — the same one, when it is right. */
  rightId: z.string().min(1),
});
export type Match = z.infer<typeof MatchSchema>;

export const AnswerSchema = z.object({
  matches: z.array(MatchSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;
