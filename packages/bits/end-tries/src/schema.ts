import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /** Per-task outcomes and attempt counts. */
  showBreakdown: z.boolean().default(true),
  showScore: z.boolean().default(true),
});
export type Data = z.infer<typeof DataSchema>;
