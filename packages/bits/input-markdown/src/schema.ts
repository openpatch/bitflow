import { z } from "zod";

export const DataSchema = z.object({
  markdown: z.string().default(""),
});
export type Data = z.infer<typeof DataSchema>;
