import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A written answer of a few sentences, and a rubric to read it against.
 *
 * The other text task, `task-input`, asks for an answer it can recognise: a
 * word, a number, a name. This one asks for reasoning, which no browser can
 * mark. So the honest thing is built in rather than papered over: the answer
 * is kept whole, the rubric is a checklist rather than a grader, and nothing
 * here ever claims that a paragraph was understood.
 *
 * `marking` is the whole of the difference between the two things this can be:
 *
 * - `person` — the task scores `unknown`, worth nothing out of nothing, and
 *   the text travels in the attempt for whoever is going to read it. The
 *   learner is told it is going to a person. This is the default, because it
 *   is the only one that is true of an open question.
 * - `keywords` — each rubric line looks for words, and the learner is told
 *   that is what happened. Useful for a self-check ("did you mention the
 *   base case?") and dishonest as a grade, which is why the wording the
 *   learner sees says *mentioned*, never *correct*.
 */
export const MARKING_MODES = ["person", "keywords"] as const;
export const MarkingSchema = z.enum(MARKING_MODES);
export type Marking = z.infer<typeof MarkingSchema>;

export const CriterionSchema = z.object({
  /** Stable across edits, so an outcome keeps pointing at the same line. */
  id: z.string().min(1),
  /** What a reader is looking for: "explains why the list must be sorted". */
  label: z.string().default(""),
  /**
   * The words that stand in for the idea, under `keywords`. Any one of them
   * counts — they are spellings of one thing, not a list of requirements.
   */
  keywords: z.array(z.string()).default([]),
  /** What meeting this line is worth. */
  points: z.number().min(0).default(1),
});
export type Criterion = z.infer<typeof CriterionSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * A prompt inside the empty box. Not a label — the question above is the
     * label — and not an example answer, which is a way of writing the answer
     * for the learner.
     */
    placeholder: z.string().default(""),
    marking: MarkingSchema.default("person"),
    /**
     * A floor on the length, in characters, or 0 for none. Held as a nudge
     * rather than a gate: it is shown as a count and never blocks submitting,
     * because a learner who has said everything they have to say in fewer
     * words has not done anything wrong.
     */
    minimumLength: z.number().int().min(0).default(0),
    /**
     * A ceiling, or 0 for none. This one is enforced, since a limit that
     * silently accepts more is not a limit and the learner would find out
     * afterwards.
     */
    maximumLength: z.number().int().min(0).default(0),
    criteria: z.array(CriterionSchema).default([]),
    /**
     * Shown once the answer is in, under `person`: the answer to compare
     * against while the learner waits to be read. Optional, because handing
     * out a model answer is not always what an author wants.
     */
    modelAnswer: z.string().default(""),
    caseSensitive: z.boolean().default(false),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { criteria, minimumLength, maximumLength, marking, evaluation } =
      ctx.value;

    const ids = criteria.map((criterion) => criterion.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: criteria,
        path: ["criteria"],
        message: "Each rubric line needs its own id.",
      });
    }

    if (maximumLength > 0 && minimumLength > maximumLength) {
      ctx.issues.push({
        code: "custom",
        input: maximumLength,
        path: ["maximumLength"],
        message:
          "The longest allowed answer is shorter than the shortest suggested one.",
      });
    }

    criteria.forEach((criterion, index) => {
      if (!criterion.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: criterion,
          path: ["criteria", index, "label"],
          message: "Say what this line is looking for.",
        });
      }

      // Only under `keywords`: a rubric a person reads needs no words at all.
      if (marking !== "keywords") return;
      if (criterion.keywords.filter((word) => word.trim()).length === 0) {
        ctx.issues.push({
          code: "custom",
          input: criterion,
          path: ["criteria", index, "keywords"],
          message:
            "Give at least one word to look for, or this line can never be met.",
        });
      }
    });

    if (evaluation.mode !== "auto") return;

    if (marking === "keywords" && criteria.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: criteria,
        path: ["criteria"],
        message:
          "Add a rubric line, or nothing is being looked for. A task marked by a person needs no rubric at all.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** What the learner wrote, whole and unaltered. */
  text: z.string().default(""),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** What one rubric line came to, carried in the result for a reader. */
export type CriterionOutcome = {
  criterionId: string;
  label: string;
  /** `undefined` where nothing looked — a rubric waiting for a person. */
  met?: boolean;
  points: number;
};

/** The length that counts, after the whitespace a learner cannot see. */
export const lengthOf = (text: string): number => text.trim().length;
