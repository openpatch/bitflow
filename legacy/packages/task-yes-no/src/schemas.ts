import {
  FeedbackMessageSchema,
  TaskAnswerSchema,
  TaskResultSchema,
  TaskSchema as TaskSchemaBase,
  TaskStatisticSchema,
} from "@bitflow/core";
import { z } from "zod";

export const TaskSchema = TaskSchemaBase.merge(
  z.object({
    subtype: z.literal("yes-no"),
    view: z.object({
      question: z.string(),
    }),
    evaluation: TaskSchemaBase.shape.evaluation.merge(
      z.object({
        yes: z.boolean(),
      })
    ),
    feedback: z.object({
      yes: FeedbackMessageSchema.optional(),
      no: FeedbackMessageSchema.optional(),
    }),
  })
);

export const StatisticSchema = TaskStatisticSchema.merge(
  z.object({
    subtype: z.literal("yes-no"),
    yes: z.number(),
    no: z.number(),
  })
);

export const AnswerSchema = TaskAnswerSchema.merge(
  z.object({
    subtype: z.literal("yes-no"),
    yes: z.boolean(),
  })
);

export const ResultSchema = TaskResultSchema.merge(
  z.object({
    subtype: z.literal("yes-no"),
    feedback: FeedbackMessageSchema.optional(),
  })
);
