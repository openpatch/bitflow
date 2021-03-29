import {
  FeedbackMessageSchema,
  TaskSchema as TaskSchemaBase,
} from "@bitflow/base";
import * as z from "zod";

export const options: ["a", "b", "c", "d", "e", "f", "g", "h"] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
];
export const OptionsSchema = z.enum(options);

export type IOption = z.infer<typeof OptionsSchema>;

export const TaskSchema = TaskSchemaBase.merge(
  z
    .object({
      subtype: z.enum(["choice"]).default("choice"),
      view: z.object({
        instruction: z.string(),
        variant: z.enum(["multiple", "single"]),
        choices: z
          .array(
            z.object({
              markdown: z.string(),
            })
          )
          .nonempty(),
      }),
      evaluation: z
        .object({
          correct: z.array(OptionsSchema),
        })
        .default({
          correct: [],
        }),
      feedback: z.object({
        patterns: z.record(FeedbackMessageSchema).default({}),
        choices: z
          .record(
            z.object({
              checkedFeedback: FeedbackMessageSchema,
              notCheckedFeedback: FeedbackMessageSchema,
            })
          )
          .default({}),
      }),
    })
    .refine(
      ({ view, evaluation }) => {
        const usedOptions: string[] = view.choices.map((_, i) => options[i]);
        for (let correctOption of evaluation.correct) {
          if (!usedOptions.includes(correctOption)) {
            return false;
          }
        }
        return true;
      },
      {
        message: "Option not in task",
        path: ["evaluation", "correct"],
      }
    )
    .refine(
      ({ view, evaluation }) =>
        (view.variant === "single" && evaluation.correct.length <= 1) ||
        view.variant === "multiple",
      {
        message: "Only one option is allowed for single variant",
        path: ["evaluation", "correct"],
      }
    )
);

export type ITask = z.infer<typeof TaskSchema>;
