import type { AttemptSnapshot } from "@bitflow/core";
import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /** Leave empty for the wording this bit ships with. */
  buttonLabel: z.string().default(""),
  /** Without `.json`; the bit adds it. */
  filename: z.string().default("attempt"),
  /**
   * Include what the learner actually wrote.
   *
   * On, the file is a complete record that can be restored into the flow and
   * re-marked in a browser. Off, it carries the outcomes and timings and no
   * answers — which is what you want when the file is going to travel by email
   * or sit in a shared folder.
   */
  includeAnswers: z.boolean().default(true),
});
export type Data = z.infer<typeof DataSchema>;

/**
 * The attempt as it will be written to the file.
 *
 * Dropping the answers drops the reasoning with them: an explanation in the
 * learner's own words is at least as revealing as the answer it explains, and
 * leaving it behind while removing the answer would be a promise half kept.
 * Confidence stays — it is a number about a task, not about a person.
 */
export const payloadOf = (
  attempt: AttemptSnapshot,
  includeAnswers: boolean,
): Record<string, unknown> => {
  if (includeAnswers) return { ...attempt };
  const { answers: _answers, reasoning: _reasoning, ...rest } = attempt;
  return { ...rest, answers: {} };
};

/** A file name that a file system will accept, always ending in `.json`. */
export const filenameOf = (data: Data): string => {
  const base = data.filename.trim().replace(/\.json$/i, "");
  // Anything a path separator or a shell might read as structure is replaced
  // rather than stripped, so two different names cannot collapse into one.
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safe || "attempt"}.json`;
};
