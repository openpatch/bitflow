import {
  defaultEvaluation,
  EvaluationSchema,
  FeedbackMessageSchema,
} from "@bitflow/core";
import { z } from "zod";

export const ChoiceSchema = z.object({
  /**
   * Stable across edits, so an answer, a result or a piece of feedback keeps
   * pointing at the same choice when the teacher reorders the list. The editor
   * generates it; the teacher never sees it.
   */
  id: z.string().min(1),
  markdown: z.string().default(""),
  correct: z.boolean().default(false),
  /** Shown when the learner ticked this choice. */
  feedbackWhenChecked: FeedbackMessageSchema.optional(),
  /** Shown when the learner left this choice unticked. */
  feedbackWhenNotChecked: FeedbackMessageSchema.optional(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const DataSchema = z
  .object({
    /** The question, as Markdown. */
    instruction: z.string().default(""),
    /** `single` renders radio buttons, `multiple` renders checkboxes. */
    variant: z.enum(["single", "multiple"]).default("single"),
    choices: z.array(ChoiceSchema).min(2),
    /** Present the choices in a different order for each learner. */
    shuffle: z.boolean().default(false),
    /**
     * Award a fraction of the point for a partly-right answer instead of
     * all-or-nothing. Only meaningful for `multiple`.
     */
    partialCredit: z.boolean().default(false),
    evaluation: EvaluationSchema.default(defaultEvaluation),
    /**
     * Feedback for one exact combination of choices — the successor to the old
     * "patterns" map, with choice ids in place of positional letters.
     */
    patternFeedback: z
      .array(
        z.object({
          choiceIds: z.array(z.string()),
          feedback: FeedbackMessageSchema,
        }),
      )
      .default([]),
  })
  .check((ctx) => {
    const ids = ctx.value.choices.map((choice) => choice.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.choices,
        path: ["choices"],
        message: "Each choice needs its own id.",
      });
    }

    // Guardrail, not pedantry: a single-choice task with two correct answers
    // cannot be answered correctly, and the teacher would only find out by
    // taking it.
    const correct = ctx.value.choices.filter((choice) => choice.correct);
    if (ctx.value.evaluation.mode === "auto" && correct.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.choices,
        path: ["choices"],
        message: "Mark at least one choice as correct, or switch grading off for this task.",
      });
    }
    if (ctx.value.variant === "single" && correct.length > 1) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.choices,
        path: ["choices"],
        message:
          "A single-choice task can only have one correct choice. Switch to multiple choice, or unmark the extra ones.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Ids of the ticked choices. */
  selected: z.array(z.string()).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Per-choice outcome, surfaced in `BitResult.detail.choices`. */
export type ChoiceState = "correct" | "wrong" | "neutral";
