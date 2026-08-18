import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Typing an author's text back, measured for accuracy and — if the author
 * asks — for speed.
 *
 * There is no H5P equivalent. The measurements are the ordinary ones from
 * typing practice: characters right where they belong, and net words per
 * minute at the conventional five characters to a word.
 *
 * Like the pointing task, this one is about an input device, and says so
 * before it starts rather than letting somebody find out by failing at it.
 * Timing can be switched off entirely — someone who types accurately with one
 * finger, a switch or a head pointer is not typing badly — and the learner can
 * stand down, which scores nothing rather than zero.
 */

/** What earns the marks. */
export const ScoringSchema = z.enum(["accuracy", "accuracyAndSpeed"]);
export type Scoring = z.infer<typeof ScoringSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** The text to type back. */
    text: z.string().default(""),
    scoring: ScoringSchema.default("accuracy"),
    /** The share of the text that has to be right, as a fraction. */
    requiredAccuracy: z.number().min(0).max(1).default(0.95),
    /** Net words per minute worth the speed mark. */
    targetWpm: z.number().int().min(5).max(200).default(25),
    /**
     * Whether the attempt is timed at all. Switching it off leaves accuracy,
     * which is the part of typing everyone can be asked for.
     */
    timed: z.boolean().default(true),
    /** Whether the learner may stand down from a task that needs a keyboard. */
    allowOptOut: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    if (ctx.value.evaluation.mode !== "auto") return;

    if (ctx.value.text.trim().length < 10) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.text,
        path: ["text"],
        message:
          "Give the learner at least ten characters to type. A shorter text measures the start and stop, not the typing.",
      });
    }

    // Timing off and speed scored is a mark nobody can earn.
    if (!ctx.value.timed && ctx.value.scoring === "accuracyAndSpeed") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.scoring,
        path: ["scoring"],
        message:
          "Speed cannot be counted when the attempt is not timed. Turn timing back on, or count accuracy only.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * What the learner typed, and how long it took.
   *
   * The finished text and one elapsed figure, and nothing else: no key-by-key
   * log, no timings per character, nothing recorded while an input method is
   * still composing. The task measures whether someone can type a passage, and
   * a record of every key they pressed on the way is neither needed for that
   * nor anyone else's business.
   */
  typed: z.string().default(""),
  /** Milliseconds from the first character to the last, measured monotonically. */
  elapsedMs: z.number().min(0).default(0),
  /** Set when the learner stood down from a task that needs a keyboard. */
  optedOut: z.boolean().default(false),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** How many characters sit in the right place. */
export const correctCharacters = (target: string, typed: string): number => {
  let correct = 0;
  for (let index = 0; index < Math.min(target.length, typed.length); index++) {
    if (target[index] === typed[index]) correct++;
  }
  return correct;
};

/**
 * The share of the passage typed correctly.
 *
 * Measured against whichever is longer, so leaving half the text out and
 * typing half a page of extra both count against it. Against the target alone,
 * stopping early would look perfect for as far as it went.
 */
export const accuracyOf = (target: string, typed: string): number => {
  const longest = Math.max(target.length, typed.length);
  return longest === 0 ? 1 : correctCharacters(target, typed) / longest;
};

/** Net words per minute, at the conventional five characters to a word. */
export const wordsPerMinute = (
  target: string,
  typed: string,
  elapsedMs: number,
): number => {
  if (elapsedMs <= 0) return 0;
  return correctCharacters(target, typed) / 5 / (elapsedMs / 60000);
};
