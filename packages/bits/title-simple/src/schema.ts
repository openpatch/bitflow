import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
});
export type Data = z.infer<typeof DataSchema>;
