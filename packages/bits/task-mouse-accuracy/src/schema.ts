import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A sequence of targets to click, and what the clicks came to.
 *
 * There is no H5P equivalent; this follows the pointing literature instead.
 * Targets appear one at a time, the learner clicks, and each round records
 * where the click landed, whether it hit, and how long it took — which is the
 * data Fitts's law is about, and the reason the task exists at all: it is for
 * lessons on human-computer interaction as much as for practice.
 *
 * It is also, unavoidably, a task about using a pointing device. That is
 * declared before the learner starts rather than discovered by someone who
 * cannot do it, and the author can let them stand it down — which scores
 * nothing rather than zero, since "did not use a mouse" is not a wrong answer.
 */

export const TargetSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same target. */
  id: z.string().min(1),
  /** The centre, as a fraction of the play area, so it lands the same on any screen. */
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  /**
   * The radius, as a fraction of the *smaller* edge — a circle stays a circle
   * whatever shape the area ends up, and the width a hit is measured against
   * means the same thing in every round.
   */
  radius: z.number().min(0.01).max(0.5).default(0.06),
});
export type Target = z.infer<typeof TargetSchema>;

/** What earns the marks. */
export const ScoringSchema = z.enum(["hits", "hitsAndSpeed"]);
export type Scoring = z.infer<typeof ScoringSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    targets: z.array(TargetSchema).default([]),
    /** How tall the play area is, as a fraction of its width. */
    aspectRatio: z.number().min(0.2).max(3).default(0.6),
    scoring: ScoringSchema.default("hits"),
    /**
     * The time a hit is expected to take, in milliseconds. Only used when
     * speed is being scored, and generous by default: this measures pointing,
     * not panic.
     */
    allowanceMs: z.number().int().min(200).max(30000).default(2000),
    /**
     * Whether the learner may stand down from a task that needs a pointing
     * device. On by default, because the alternative is asking someone to
     * fail at something they were never able to do.
     */
    allowOptOut: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { targets } = ctx.value;

    const ids = targets.map((target) => target.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: targets,
        path: ["targets"],
        message: "Each target needs its own id.",
      });
    }

    if (ctx.value.evaluation.mode !== "auto") return;

    if (targets.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: targets,
        path: ["targets"],
        message: "Add at least one target to click.",
      });
    }

    // A target the play area cannot hold is one nobody can hit.
    targets.forEach((target, index) => {
      const radiusX = target.radius * Math.min(1, ctx.value.aspectRatio);
      const radiusY = (target.radius * Math.min(1, ctx.value.aspectRatio)) / ctx.value.aspectRatio;
      if (
        target.x - radiusX < 0 ||
        target.x + radiusX > 1 ||
        target.y - radiusY < 0 ||
        target.y + radiusY > 1
      ) {
        ctx.issues.push({
          code: "custom",
          input: target,
          path: ["targets", index],
          message: "This target hangs over the edge of the area, so part of it cannot be clicked.",
        });
      }
    });
  });

export type Data = z.infer<typeof DataSchema>;

export const RoundSchema = z.object({
  targetId: z.string().min(1),
  /** Where the click landed, in the same fractions the targets use. */
  x: z.number(),
  y: z.number(),
  hit: z.boolean(),
  /** Milliseconds from the target appearing to the click, measured monotonically. */
  ms: z.number().min(0),
});
export type Round = z.infer<typeof RoundSchema>;

export const AnswerSchema = z.object({
  /**
   * One entry per target, in the order they were shown.
   *
   * Deliberately the whole of what is kept: where the click landed inside this
   * task's own area, whether it hit, and how long it took. No screen or window
   * coordinates, no pointer type, no device or input trace — the task measures
   * a person's aim, and has no business describing their hardware.
   */
  rounds: z.array(RoundSchema).default([]),
  /** Set when the learner stood down from a task that needs a pointing device. */
  optedOut: z.boolean().default(false),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** The centre-to-centre distance between two targets, in fractions. */
export const distanceBetween = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  aspectRatio: number,
): number =>
  Math.hypot(to.x - from.x, (to.y - from.y) * aspectRatio);

/**
 * Fitts's index of difficulty for a move: `log2(2 * distance / width)`.
 *
 * Reported rather than scored. The point of the task is often to plot time
 * against this and find the straight line, and a component that measures both
 * and hands over neither would be no use for that.
 */
export const indexOfDifficulty = (distance: number, width: number): number =>
  width > 0 ? Math.log2((2 * distance) / width + 1) : 0;
