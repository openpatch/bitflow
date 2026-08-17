import { EvaluationSchema, FeedbackMessageSchema } from "@bitflow/core";
import { z } from "zod";

/** Rejects a pattern the browser's own engine cannot compile. */
const isValidRegex = (pattern: string): boolean => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * How the answer is checked. The old version only offered a raw regular
     * expression, which meant a teacher wanting "the answer is Paris" had to
     * write one — and get the escaping right.
     */
    matchMode: z.enum(["exact", "contains", "regex"]).default("exact"),
    /** Accepted answers for `exact`/`contains`; any one of them counts. */
    expected: z.array(z.string()).default([]),
    /** Used when `matchMode` is `regex`. */
    pattern: z.string().default(""),
    caseSensitive: z.boolean().default(false),
    trim: z.boolean().default(true),
    /** Render a textarea instead of a single-line input. */
    multiline: z.boolean().default(false),
    evaluation: EvaluationSchema.default({
      mode: "auto",
      enableRetry: false,
      showFeedback: true,
    }),
    /** Feedback attached to answers matching a pattern. */
    patternFeedback: z
      .array(
        z.object({
          pattern: z.string(),
          feedback: FeedbackMessageSchema,
        }),
      )
      .default([]),
  })
  .check((ctx) => {
    const { matchMode, pattern, expected, evaluation } = ctx.value;
    if (evaluation.mode !== "auto") return;

    if (matchMode === "regex") {
      if (!pattern) {
        ctx.issues.push({
          code: "custom",
          input: pattern,
          path: ["pattern"],
          message: "Enter the pattern the answer has to match.",
        });
      } else if (!isValidRegex(pattern)) {
        ctx.issues.push({
          code: "custom",
          input: pattern,
          path: ["pattern"],
          message: "This is not a valid regular expression.",
        });
      }
      return;
    }

    if (expected.filter((value) => value.trim()).length === 0) {
      ctx.issues.push({
        code: "custom",
        input: expected,
        path: ["expected"],
        message:
          "Enter at least one accepted answer, or switch evaluation to manual.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({ input: z.string().default("") });
export type Answer = z.infer<typeof AnswerSchema>;
