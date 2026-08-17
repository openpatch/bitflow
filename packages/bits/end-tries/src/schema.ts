import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /** Per-task outcomes and attempt counts. */
  showBreakdown: z.boolean().default(true),
  showScore: z.boolean().default(true),
  /**
   * Let the learner open a task from the summary and see what they answered,
   * read-only. Off by default: a teacher may not want the paper handed back.
   */
  allowReview: z.boolean().default(false),
});
export type Data = z.infer<typeof DataSchema>;
