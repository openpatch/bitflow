import type { AttemptSnapshot, BitflowDocument } from "@bitflow/core";
import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /** Who the assessment was set by. Printed under the message. */
  issuer: z.string().default(""),
  showName: z.boolean().default(true),
  showScore: z.boolean().default(true),
  showDate: z.boolean().default(true),
  /** Leave empty for the wording this bit ships with. */
  printLabel: z.string().default(""),
});
export type Data = z.infer<typeof DataSchema>;

/**
 * The type of the step that asks a learner who they are.
 *
 * Matched as a string rather than imported. A certificate that depended on the
 * package would drag it into every bundle that loads a certificate, and the
 * two are wired together by the author putting both in a flow — not by one
 * needing the other's code.
 */
const IDENTIFY = "start-identify";

/**
 * What the learner called themselves, if the flow asked.
 *
 * The first field that got an answer, in the order they were asked: the field
 * an author puts first is the one they mean as the name, which is exactly what
 * `start-identify` tells its author.
 */
export const nameIn = (
  flow: BitflowDocument | undefined,
  attempt: AttemptSnapshot | undefined,
): string | undefined => {
  if (!flow || !attempt) return undefined;

  for (const node of flow.nodes) {
    if (node.type !== IDENTIFY) continue;
    const answer = attempt.answers[node.id];
    if (!answer || typeof answer !== "object") continue;

    const fields = node.data?.fields;
    if (!Array.isArray(fields)) continue;
    for (const field of fields) {
      const id = (field as { id?: unknown })?.id;
      if (typeof id !== "string") continue;
      const value = (answer as Record<string, unknown>)[id];
      if (typeof value === "string" && value.trim() !== "") return value.trim();
    }
  }
  return undefined;
};

/**
 * When the run finished. `completedAt` when there is one, otherwise the last
 * time anything changed — a certificate for a run in progress is still dated
 * the moment it describes, not the moment it was printed.
 */
export const finishedAt = (
  attempt: AttemptSnapshot | undefined,
): Date | undefined => {
  const stamp = attempt?.completedAt ?? attempt?.updatedAt;
  if (!stamp) return undefined;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
