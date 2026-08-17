import { EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Blanks are written into the text as `[[1]]`, `[[2]]`, … rather than being
 * kept in a parallel list. The teacher sees the gap where it will appear, and
 * the text and its blanks cannot drift apart the way two separate fields do.
 */
export const BLANK_PATTERN = /\[\[(\w+)\]\]/g;

export const blankIdsIn = (text: string): string[] => {
  const ids: string[] = [];
  for (const match of text.matchAll(BLANK_PATTERN)) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
};

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** Plain text with `[[n]]` markers where the gaps go. */
    text: z.string().default(""),
    /** Blank id → the answers that count as right for it. */
    blanks: z.record(z.string(), z.array(z.string())).default({}),
    caseSensitive: z.boolean().default(false),
    trim: z.boolean().default(true),
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default({
      mode: "auto",
      enableRetry: false,
      showFeedback: true,
    }),
  })
  .check((ctx) => {
    if (ctx.value.evaluation.mode !== "auto") return;

    const ids = blankIdsIn(ctx.value.text);
    if (ids.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.text,
        path: ["text"],
        message: "Add at least one blank, written as [[1]].",
      });
      return;
    }

    for (const id of ids) {
      const accepted = (ctx.value.blanks[id] ?? []).filter((v) => v.trim());
      if (accepted.length === 0) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value.blanks,
          path: ["blanks", id],
          message: `Enter at least one accepted answer for blank ${id}.`,
        });
      }
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Blank id → what the learner typed. */
  blanks: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

export type BlankState = "correct" | "wrong" | "neutral";
