import {
  FeedbackMessageSchema,
  TaskAnswerSchema,
  TaskResultSchema,
  TaskSchema as TaskSchemaBase,
  TaskStatisticSchema,
} from "@bitflow/core";
import * as z from "zod";

export const TaskSchema = TaskSchemaBase.merge(
  z.object({
    subtype: z.literal("input"),
    view: z.object({
      instruction: z.string(),
    }),
    evaluation: TaskSchemaBase.shape.evaluation.merge(
      z.object({
        pattern: z.string().refine(
          (pattern) => {
            try {
              new RegExp(pattern);
              return true;
            } catch (e) {
              return false;
            }
          },
          { message: "Pattern must be a valid regular expression" }
        ),
      })
    ),
    feedback: z.object({
      patterns: z.array(
        z.object({
          pattern: z.string().refine(
            (pattern) => {
              try {
                new RegExp(pattern);
                return true;
              } catch (e) {
                return false;
              }
            },
            { message: "Pattern must be a valid regular expression" }
          ),
          feedback: FeedbackMessageSchema,
        })
      ),
    }),
  })
);

export const StatisticSchema = TaskStatisticSchema.merge(
  z.object({
    subtype: z.literal("input"),
    patterns: z.record(
      z.object({
        count: z.number(),
      })
    ),
    inputs: z.record(
      z.object({
        correct: z.boolean(),
        count: z.number(),
      })
    ),
  })
);

export const AnswerSchema = TaskAnswerSchema.merge(
  z.object({
    subtype: z.literal("input"),
    input: z.string(),
  })
);

export const ResultSchema = TaskResultSchema.merge(
  z.object({
    subtype: z.literal("input"),
    feedback: z.array(FeedbackMessageSchema),
  })
);
