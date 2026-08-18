import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A Parsons problem: the lines of a program, shuffled, for the learner to put
 * back together.
 *
 * H5P has no equivalent, so this follows the convention the Parsons literature
 * and js-parsons established — a bank of lines including ones that do not
 * belong, a solution built from them, and optional indentation as a second
 * dimension to get right.
 *
 * The point of the exercise is that the learner reasons about structure
 * without fighting syntax, so the code is only ever text. Nothing here runs
 * anything.
 */

export const LineSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same line. */
  id: z.string().min(1),
  text: z.string().default(""),
  /**
   * How far this line is indented in the finished program, in steps rather
   * than spaces — the learner is being asked about nesting, not whitespace.
   */
  indent: z.number().int().min(0).default(0),
  /**
   * A line that belongs nowhere. Shown among the rest, and the reason a
   * Parsons problem is harder than putting a list in order: the learner has
   * to decide what is not part of the answer.
   */
  distractor: z.boolean().default(false),
});
export type Line = z.infer<typeof LineSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * Recorded so the code can be shown as what it is. Nothing highlights it:
     * that would mean a parser per language, and the exercise is about
     * structure rather than colour.
     */
    language: z.string().default(""),
    /** The solution lines in order, with the distractors mixed among them. */
    lines: z.array(LineSchema).default([]),
    /**
     * Whether indentation is part of the answer. Off, the learner is asked
     * only for the order and indentation is shown but not adjustable.
     */
    indentationMatters: z.boolean().default(false),
    /**
     * Whether using a line that belongs nowhere costs a point. Off by
     * default: leaving a distractor out is already rewarded by the lines that
     * then land in the right place.
     */
    penaliseDistractors: z.boolean().default(false),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const ids = ctx.value.lines.map((line) => line.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.lines,
        path: ["lines"],
        message: "Each line needs its own id.",
      });
    }

    ctx.value.lines.forEach((line, index) => {
      if (!line.text.trim()) {
        ctx.issues.push({
          code: "custom",
          input: line,
          path: ["lines", index, "text"],
          message: "Give this line some code.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    const solution = ctx.value.lines.filter((line) => !line.distractor);
    if (solution.length < 2) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.lines,
        path: ["lines"],
        message:
          "Add at least two lines that belong in the program. One is not an ordering.",
      });
    }

    // Indentation that never changes is a column of zeros the learner has to
    // confirm — busywork that costs half the marks.
    if (
      ctx.value.indentationMatters &&
      solution.length > 0 &&
      solution.every((line) => line.indent === solution[0].indent)
    ) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.indentationMatters,
        path: ["indentationMatters"],
        message:
          "Every line is at the same indentation, so asking for indentation adds nothing. Indent the nested lines, or switch it off.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const PlacedLineSchema = z.object({
  lineId: z.string().min(1),
  indent: z.number().int().min(0).default(0),
});
export type PlacedLine = z.infer<typeof PlacedLineSchema>;

export const AnswerSchema = z.object({
  /** The lines the learner has put in the program, in order. */
  lines: z.array(PlacedLineSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;
