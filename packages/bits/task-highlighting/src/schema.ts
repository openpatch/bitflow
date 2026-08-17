import { EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Five hues chosen to stay distinguishable for the most common colour vision
 * deficiencies (from sashamaps.net's 99.99%-accessible palette). Every
 * highlight also carries its colour's meaning as text, so colour is never the
 * only channel.
 */
export const COLORS = ["maroon", "orange", "blue", "lavender", "yellow"] as const;
export const ColorSchema = z.enum(COLORS);
export type Color = z.infer<typeof ColorSchema>;

/** One entry per character of `text`; `null` where nothing is highlighted. */
export const HighlightsSchema = z.array(ColorSchema.nullable());
export type Highlights = z.infer<typeof HighlightsSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    text: z.string().default(""),
    // `partialRecord`, not `record`: a task uses one or two colours, and a
    // plain enum-keyed record in zod 4 would demand an entry for all five.
    colors: z
      .partialRecord(
        ColorSchema,
        z.object({
          enabled: z.boolean().default(false),
          /** What this colour means in this task, e.g. "cause". */
          label: z.string().default(""),
        }),
      )
      .default({}),
    /** The teacher's own highlighting, compared against character by character. */
    reference: HighlightsSchema.default([]),
    /**
     * Per colour, the Cohen's kappa a learner must reach for that colour to
     * count as right. Kappa rather than raw overlap because agreeing by
     * accident on a mostly-unhighlighted text is easy.
     */
    cutoffs: z.partialRecord(ColorSchema, z.number().min(0).max(1)).default({}),
    evaluation: EvaluationSchema.default({
      mode: "auto",
      enableRetry: false,
      showFeedback: true,
    }),
  })
  .check((ctx) => {
    if (ctx.value.evaluation.mode !== "auto") return;

    const enabled = COLORS.filter((color) => ctx.value.colors[color]?.enabled);
    if (enabled.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.colors,
        path: ["colors"],
        message: "Switch on at least one colour for the learner to use.",
      });
    }

    // A reference of the wrong length cannot be compared, and the mismatch is
    // invisible in the JSON — it only shows up as a nonsensical score.
    if (
      ctx.value.reference.length > 0 &&
      ctx.value.reference.length !== ctx.value.text.length
    ) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.reference,
        path: ["reference"],
        message:
          "The reference highlighting does not match the text. Re-mark the text after editing it.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  highlights: HighlightsSchema.default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;
