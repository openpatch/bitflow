import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";
import {
  digitsNeeded,
  read,
  REPRESENTATIONS,
  write,
  type ParseOptions,
} from "./numbers";

/**
 * The same value, written again another way.
 *
 * The width and the signedness belong to the *value*, not to either
 * representation: "an eight-bit signed integer" is what a thing is, and decimal
 * and binary are two ways of writing it down. That is why there is one of each
 * setting rather than one per side, and it is what makes the interesting
 * question — 214 and −42 are the same eight bits — expressible at all.
 */

export const RepresentationSchema = z.enum(REPRESENTATIONS);

export const ScoringSchema = z.enum(["answer", "digits"]);
export type Scoring = z.infer<typeof ScoringSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    sourceRepresentation: RepresentationSchema.default("decimal"),
    /** The value as the author writes it, in the source representation. */
    sourceValue: z.string().default(""),
    targetRepresentation: RepresentationSchema.default("binary"),
    /** Bits the value is held in. `0` for a plain integer of no fixed width. */
    bitWidth: z.number().int().min(0).max(64).default(8),
    signed: z.boolean().default(false),
    /** Whether `0b`, `0o` and `0x` are accepted in front of the answer. */
    allowPrefix: z.boolean().default(true),
    /** Whether spaces and underscores may break the digits into groups. */
    allowSeparators: z.boolean().default(true),
    /** Whether the leading zeros of the width have to be written out. */
    requireFullWidth: z.boolean().default(true),
    scoring: ScoringSchema.default("answer"),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    if (ctx.value.evaluation.mode !== "auto") return;
    const data = ctx.value as Data;

    if (data.sourceRepresentation === data.targetRepresentation) {
      ctx.issues.push({
        code: "custom",
        input: data.targetRepresentation,
        path: ["targetRepresentation"],
        message: "Ask for a different representation; this one copies the question.",
      });
    }

    const source = read(data.sourceValue, data.sourceRepresentation, sourceOptions(data));
    if (!source.ok) {
      ctx.issues.push({
        code: "custom",
        input: data.sourceValue,
        path: ["sourceValue"],
        message:
          source.reason === "empty"
            ? "Write the value the learner is to convert."
            : source.reason === "tooWide"
              ? `That does not fit in ${data.bitWidth} bits.`
              : "That is not a value in the representation chosen for it.",
      });
      return;
    }

    // Several values need somewhere to end and the next to begin. Without
    // separators there is no way to write the answer down at all.
    if (
      source.values.length > 1 &&
      data.targetRepresentation !== "text" &&
      !data.allowSeparators
    ) {
      ctx.issues.push({
        code: "custom",
        input: data.allowSeparators,
        path: ["allowSeparators"],
        message: "Allow separators: the answer has more than one group of digits.",
      });
    }

    if (data.scoring === "digits") {
      const needed = digitsNeeded(data.bitWidth, data.targetRepresentation);
      if (needed === 0 || !data.requireFullWidth) {
        ctx.issues.push({
          code: "custom",
          input: data.scoring,
          path: ["scoring"],
          message:
            "Marking digit by digit needs a fixed width, written out in full, in a base.",
        });
      }
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * What the learner typed, and only that. What it comes to is derived — one
   * stored copy that can disagree with the box after a reload is worse than
   * reading it twice.
   */
  raw: z.string().default(""),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** How the learner's answer is read. */
export const answerOptions = (data: Data): ParseOptions => ({
  bitWidth: data.bitWidth,
  signed: data.signed,
  allowPrefix: data.allowPrefix,
  allowSeparators: data.allowSeparators,
  requireFullWidth: data.requireFullWidth,
});

/**
 * How the author's own value is read: the same, except that they are not held
 * to writing the leading zeros. That rule is about what the learner has to
 * produce, and applying it here would only reject a perfectly clear `42`.
 */
export const sourceOptions = (data: Data): ParseOptions => ({
  ...answerOptions(data),
  requireFullWidth: false,
});

/** The value the question is about, or nothing when the author's value is not one. */
export const expectedValues = (data: Data): bigint[] | undefined => {
  const source = read(data.sourceValue, data.sourceRepresentation, sourceOptions(data));
  return source.ok ? source.values : undefined;
};

/** The answer as it would be written out in full. */
export const expectedWritten = (data: Data): string => {
  const values = expectedValues(data);
  return values === undefined
    ? ""
    : write(values, data.targetRepresentation, answerOptions(data));
};
