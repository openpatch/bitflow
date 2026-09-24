import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * An array and the steps of an algorithm over it: a sorting pass, a push or a
 * pop. The learner writes down (or rearranges) the array as it stands after
 * each step, the same way a textbook animation is checked by hand.
 *
 * Two ways to answer a step, because the two things this is used for shape the
 * answer differently. A sort never adds or removes an element — it only moves
 * them — so `rearrange` asks for a permutation and is answered by swapping.
 * A stack or queue *changes size*, so `write` asks for whatever text belongs in
 * each of a fixed number of boxes, blank included.
 */

export const MODES = ["rearrange", "write"] as const;
export const ModeSchema = z.enum(MODES);
export type Mode = z.infer<typeof ModeSchema>;

export const StepSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same step. */
  id: z.string().min(1),
  /** "After pass 1", "push(4)" — short, and plain text: it also has to work
   *  unadorned inside an aria-label. */
  label: z.string().default(""),
  /** The array as it stands once this step has happened. */
  expected: z.array(z.string()).default([]),
});
export type Step = z.infer<typeof StepSchema>;

/**
 * Whether two arrays hold the same values, order aside.
 *
 * What a `rearrange` step's `expected` has to be against `initial`: sorting
 * moves elements around, it never invents or drops one, so anything that is
 * not a reordering of the same multiset could never be reached by swapping.
 */
export const isPermutationOf = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** The starting array, shown read-only above the steps. */
    initial: z.array(z.string()).default([]),
    steps: z.array(StepSchema).default([]),
    mode: ModeSchema.default("rearrange"),
    /** Index numbers above the cells. Off only for an array where position is
     *  not part of the question. */
    showIndices: z.boolean().default(true),
    caseSensitive: z.boolean().default(false),
    /** A point per correct step rather than one for the whole task. On by
     *  default: a sort that goes wrong on the last pass still had every
     *  earlier one right. */
    partialCredit: z.boolean().default(true),
    /**
     * `write` mode only: how many boxes a row has. Omitted means the widest
     * row already authored — `initial` or any step's `expected` — so a row
     * that only ever shrinks needs nothing set here at all.
     */
    slots: z.number().int().positive().optional(),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { initial, steps, mode, evaluation } = ctx.value;

    const stepIds = steps.map((step) => step.id);
    if (new Set(stepIds).size !== stepIds.length) {
      ctx.issues.push({
        code: "custom",
        input: steps,
        path: ["steps"],
        message: "Each step needs its own id.",
      });
    }

    if (mode === "rearrange" && initial.length > 0) {
      steps.forEach((step, index) => {
        if (!isPermutationOf(initial, step.expected)) {
          ctx.issues.push({
            code: "custom",
            input: step,
            path: ["steps", index, "expected"],
            message:
              "In rearrange mode a step can only reorder the initial array — this row has different values, or a different number of them.",
          });
        }
      });
    }

    if (evaluation.mode !== "auto") return;

    if (initial.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: initial,
        path: ["initial"],
        message: "Add the starting array.",
      });
    }

    if (steps.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: steps,
        path: ["steps"],
        message: "Add at least one step.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** One row per step, in order. A step the learner has not touched yet has
   *  no entry here at all — see `carryForward`. */
  rows: z.array(z.array(z.string())).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** The row the learner actually put down for a step, or `undefined` if they
 *  have not touched it. */
export const rowAt = (
  answer: Answer | undefined,
  index: number,
): string[] | undefined => answer?.rows?.[index];

/**
 * What a step's row reads as right now, touched or not.
 *
 * A step nobody has interacted with yet is not blank — it is whatever came
 * before, exactly as `rearrange` hands it over for swapping and exactly what
 * `evaluate` scores it against. Recorded lazily (only once the learner does
 * something to a row) rather than filled in up front, but read back the same
 * way everywhere, so there is only ever one rule for "what is here right now".
 */
export const carryForward = (
  data: Data,
  answer: Answer | undefined,
  index: number,
): string[] => {
  const row = rowAt(answer, index);
  if (row) return row;
  if (index <= 0) return [...data.initial];
  return carryForward(data, answer, index - 1);
};

/**
 * How many boxes a `write` row has.
 *
 * The widest row already written, so a stack that only ever shrinks from its
 * starting size needs nothing configured — and one that grows past it just
 * wants the author to say so with `slots`.
 */
export const slotCountOf = (data: Data): number => {
  if (data.slots && data.slots > 0) return data.slots;
  return Math.max(0, data.initial.length, ...data.steps.map((step) => step.expected.length));
};

/**
 * A step's row, padded out to its box count in `write` mode.
 *
 * `rearrange` never pads — its row is always exactly `initial.length` long,
 * because a swap can neither create nor remove a box.
 */
export const displayRow = (
  data: Data,
  answer: Answer | undefined,
  index: number,
): string[] => {
  const row = carryForward(data, answer, index);
  if (data.mode !== "write") return row;
  const slots = slotCountOf(data);
  return Array.from({ length: slots }, (_, i) => row[i] ?? "");
};

/**
 * Sets one step's row, filling in every earlier row that is still implicit so
 * the stored answer never has a gap for `carryForward` to paper over twice.
 */
export const withRow = (
  data: Data,
  answer: Answer | undefined,
  index: number,
  row: string[],
): Answer => {
  const rows: string[][] = [];
  for (let i = 0; i < index; i++) {
    rows[i] = rowAt(answer, i) ?? carryForward(data, answer, i);
  }
  rows[index] = row;
  return { rows };
};
