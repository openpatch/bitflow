import {
  FeedbackMessageSchema,
  TaskSchema as TaskSchemaBase,
} from "@bitflow/base";
import { z } from "zod";

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
  z.object({
    subtype: z.literal("choice"),
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
    evaluation: TaskSchemaBase.shape.evaluation.merge(
      z.object({
        correct: z.array(OptionsSchema),
      })
    ),
    feedback: z.object({
      patterns: z.record(FeedbackMessageSchema),
      choices: z.record(
        z.object({
          checkedFeedback: FeedbackMessageSchema,
          notCheckedFeedback: FeedbackMessageSchema,
        })
      ),
    }),
  })
);

export type ITask = z.infer<typeof TaskSchema>;
