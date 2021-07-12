import {
  FeedbackMessageSchema,
  TaskAnswerSchema,
  TaskResultSchema as TaskResultSchemaBase,
  TaskSchema as TaskSchemaBase,
  TaskStatisticSchema,
} from "@bitflow/core";
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
        z
          .object({
            checkedFeedback: FeedbackMessageSchema,
            notCheckedFeedback: FeedbackMessageSchema,
          })
          .partial()
      ),
    }),
  })
);

export const ResultSchema = TaskResultSchemaBase.merge(
  z.object({
    subtype: z.literal("choice"),
    choices: z.record(
      z.object({
        state: z.enum(["wrong", "correct", "neutral"]),
        feedback: FeedbackMessageSchema.optional(),
      })
    ),
    feedback: FeedbackMessageSchema.optional(),
  })
);

export const AnswerSchema = TaskAnswerSchema.merge(
  z.object({
    subtype: z.literal("choice"),
    checked: z.record(z.boolean()),
  })
);

export const StatisticSchema = TaskStatisticSchema.merge(
  z.object({
    subtype: z.literal("choice"),
    patterns: z.record(
      z.object({
        count: z.number().positive(),
        correct: z.boolean(),
      })
    ),
  })
);
