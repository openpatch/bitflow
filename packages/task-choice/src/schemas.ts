import * as z from "zod";
import { IEvaluation, ITask, options } from "./types";

export const optionsSchema = z.union([
  z.literal("a"),
  z.literal("b"),
  z.literal("c"),
  z.literal("d"),
  z.literal("e"),
  z.literal("f"),
  z.literal("g"),
  z.literal("h"),
]);

export const taskSchema = z.object({
  title: z.string(),
  instruction: z.string(),
  variant: z.union([z.literal("multiple"), z.literal("single")]),
  choices: z.array(
    z.object({
      id: z.string().optional(),
      markdown: z.string(),
    })
  ),
});

export const evaluationSchema = ({ task }: { task: ITask }) =>
  z.object({
    mode: z.union([z.literal("auto"), z.literal("skip"), z.literal("manual")]),
    enableRetry: z.boolean(),
    showFeedback: z.boolean(),
    correct: z
      .array(optionsSchema)
      .refine(
        (correct) => {
          const usedOptions: string[] = task.choices.map((_, i) => options[i]);
          for (let correctOption of correct) {
            if (!usedOptions.includes(correctOption)) {
              return false;
            }
          }
          return true;
        },
        {
          message: "Option not in task",
        }
      )
      .refine(
        (correct) =>
          (task.variant === "single" && correct.length <= 1) ||
          task.variant === "multiple",
        {
          message: "Only one option is allowed for single variant",
        }
      ),
  });

const feedbackMessageSchema = z.object({
  message: z.string(),
  severity: z.union([
    z.literal("info"),
    z.literal("warning"),
    z.literal("error"),
    z.literal("success"),
  ]),
});

export const feedbackSchema = ({
  evaluation,
  task,
}: {
  evaluation: IEvaluation;
  task: ITask;
}) =>
  z.object({
    patterns: z.record(feedbackMessageSchema),
    choices: z.record(
      z.object({
        checkedFeedback: feedbackMessageSchema,
        notCheckedFeedback: feedbackMessageSchema,
      })
    ),
  });
