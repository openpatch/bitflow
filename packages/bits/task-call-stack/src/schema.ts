import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A program and the call stack at a few moments of its run — a recursive
 * factorial halfway down, the moment the base case returns — for the learner to
 * write down frame by frame.
 *
 * It is the question a memory diagram asks on paper and a stepping debugger
 * answers on screen: which calls are waiting, in which order, and with what in
 * their parameters. The code is shown as text and never run; the stacks are
 * authored, the same way a trace table's values are.
 *
 * Stacks are written top first, the call running now at the top, because that
 * is how every stack is drawn and read — the order the author types a stack in
 * is the order it appears on the screen.
 */

export const FrameSchema = z.object({
  /** The call, as it would be written: `fak(3)`, `sum(list, 2)`. */
  call: z.string().default(""),
  /** Its local variables, as one line: `n = 3, result = ?`. Only asked for
   *  when the task shows the column. */
  locals: z.string().default(""),
});
export type Frame = z.infer<typeof FrameSchema>;

export const CheckpointSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same moment. */
  id: z.string().min(1),
  /** "Before the base case returns" — short, and plain text: it is also read
   *  out inside the stack's accessible name. */
  label: z.string().default(""),
  /** The line the moment belongs to, marked beside the listing. 1-based. */
  line: z.number().int().positive().optional(),
  /** The stack at this moment, the running call first. */
  expected: z.array(FrameSchema).default([]),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

/** A program as its lines, with a final newline not counted as an extra empty line. */
export const linesOf = (code: string): string[] => code.replace(/\n$/, "").split("\n");

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /** Names the language for the reader. It picks no parser and no
     *  highlighter, and nothing here ever runs the code. */
    language: z.string().default(""),
    code: z.string().default(""),
    showLineNumbers: z.boolean().default(true),
    /** Whether each frame also asks for its local variables. */
    showLocals: z.boolean().default(false),
    checkpoints: z.array(CheckpointSchema).default([]),
    caseSensitive: z.boolean().default(false),
    /** A point per moment rather than one for the whole run. */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { checkpoints, code, evaluation, showLocals } = ctx.value;

    const ids = checkpoints.map((checkpoint) => checkpoint.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: checkpoints,
        path: ["checkpoints"],
        message: "Each moment needs its own id.",
      });
    }

    const lineCount = linesOf(code).length;
    checkpoints.forEach((checkpoint, index) => {
      if (checkpoint.line !== undefined && checkpoint.line > lineCount) {
        ctx.issues.push({
          code: "custom",
          input: checkpoint.line,
          path: ["checkpoints", index, "line"],
          message: `The program has ${lineCount} lines, so there is no line ${checkpoint.line}.`,
        });
      }
    });

    if (evaluation.mode !== "auto") return;

    if (code.trim() === "") {
      ctx.issues.push({
        code: "custom",
        input: code,
        path: ["code"],
        message: "Add the program the stacks belong to.",
      });
    }

    if (checkpoints.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: checkpoints,
        path: ["checkpoints"],
        message: "Add at least one moment to write the stack down for.",
      });
    }

    checkpoints.forEach((checkpoint, index) => {
      checkpoint.expected.forEach((frame, frameIndex) => {
        if (frame.call.trim() === "") {
          ctx.issues.push({
            code: "custom",
            input: frame,
            path: ["checkpoints", index, "expected", frameIndex, "call"],
            message: "Every frame on the stack needs its call written out.",
          });
        }
        if (showLocals && frame.locals.trim() === "") {
          ctx.issues.push({
            code: "custom",
            input: frame,
            path: ["checkpoints", index, "expected", frameIndex, "locals"],
            message: "The task asks for local variables, so every frame needs them — write “-” for none.",
          });
        }
      });
    });
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Checkpoint id → the stack the learner wrote, the running call first. A
   *  moment not yet touched has no entry — see `carriedStack`. */
  stacks: z.record(z.string(), z.array(FrameSchema)).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

/**
 * The stack shown for a moment: the learner's own, or — where they have not
 * touched it yet — the one they wrote for the moment before, since that is
 * where every stack at the next moment starts from. The first moment starts
 * empty. `evaluate` reads it the same way, so there is one rule for what is
 * on the screen and what is marked.
 */
export const carriedStack = (data: Data, answer: Answer | undefined, index: number): Frame[] => {
  for (let at = index; at >= 0; at--) {
    const stack = answer?.stacks?.[data.checkpoints[at]?.id ?? ""];
    if (stack) return stack;
  }
  return [];
};

/** The answer with one moment's stack replaced. */
export const withStack = (answer: Answer | undefined, checkpointId: string, stack: Frame[]): Answer => ({
  stacks: { ...answer?.stacks, [checkpointId]: stack },
});
