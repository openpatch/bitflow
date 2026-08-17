import { EvaluationSchema, FeedbackMessageSchema } from "@bitflow/core";
import { z } from "zod";

export const DataSchema = z.object({
  /** The statement or question, as Markdown. */
  question: z.string().default(""),
  /** Which answer counts as right. */
  correctAnswer: z.boolean().default(true),
  /** Shown when the learner answered yes and yes was wrong. */
  feedbackWhenYes: FeedbackMessageSchema.optional(),
  /** Shown when the learner answered no and no was wrong. */
  feedbackWhenNo: FeedbackMessageSchema.optional(),
  evaluation: EvaluationSchema.default({
    mode: "auto",
    enableRetry: false,
    showFeedback: true,
  }),
});
export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({ yes: z.boolean() });
export type Answer = z.infer<typeof AnswerSchema>;
