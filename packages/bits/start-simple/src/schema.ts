import { getBit, type BitflowDocument } from "@bitflow/core";
import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /**
   * Show what is ahead: roughly how many questions, the time limit, and
   * whether they can go back.
   *
   * Worked out from the flow rather than typed by the author, so it cannot go
   * stale the way "this test has 12 questions" does the moment a thirteenth is
   * added.
   */
  showOutline: z.boolean().default(false),
});
export type Data = z.infer<typeof DataSchema>;

export type Outline = {
  /**
   * Roughly how many questions. Approximate on purpose: branching means not
   * every learner meets every task, and a pool hands out only some of its
   * members — so this counts what a pool draws, not what it holds.
   */
  questions: number;
  /** Seconds for the whole assessment, when there is a limit. */
  timeLimit?: number;
  canGoBack: boolean;
};

/**
 * What the flow can honestly promise before it starts.
 *
 * `undefined` when there is no document — a start bit rendered on its own, as
 * in an author's preview, knows nothing about an assessment to describe.
 */
export const outlineOf = (flow: BitflowDocument | undefined): Outline | undefined => {
  if (!flow) return undefined;

  const isTask = (type: string) => getBit(type)?.kind === "task";
  let questions = 0;
  const counted = new Set<string>();

  for (const node of flow.nodes) {
    if (!node.pool) {
      if (isTask(node.type)) questions += 1;
      continue;
    }
    if (counted.has(node.pool)) continue;
    counted.add(node.pool);

    const pool = flow.meta.pools.find((candidate) => candidate.id === node.pool);
    const members = flow.nodes.filter(
      (other) => other.pool === node.pool && isTask(other.type),
    ).length;
    // A pool that asks for more than it has simply hands out all of it.
    questions += Math.min(pool?.draw ?? members, members);
  }

  return {
    questions,
    timeLimit: flow.meta.timeLimit,
    canGoBack: flow.meta.navigation !== "linear",
  };
};
