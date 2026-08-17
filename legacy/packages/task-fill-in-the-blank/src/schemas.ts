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
    subtype: z.literal("fill-in-the-blank"),
    view: z.object({
      instruction: z.string(),
      textWithBlanks: z.string(),
    }),
    evaluation: TaskSchemaBase.shape.evaluation.merge(
      z.object({
        blanks: z.record(
          z.string().refine(
            (pattern) => {
              try {
                new RegExp(pattern);
                return true;
              } catch (e) {
                return false;
              }
            },
            { message: "Pattern must be a valid regular expression" }
          )
        ),
      })
    ),
    feedback: z.object({
      blanks: z.record(
        z.object({
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
        })
      ),
    }),
  })
);

export const StatisticSchema = TaskStatisticSchema.merge(
  z.object({
    subtype: z.literal("fill-in-the-blank"),
    blanks: z.record(
      z.record(
        z.object({
          correct: z.boolean(),
          count: z.number(),
        })
      )
    ),
  })
);

export const ResultSchema = TaskResultSchema.merge(
  z.object({
    subtype: z.literal("fill-in-the-blank"),
    blanks: z.record(
      z.object({
        state: z.enum(["neutral", "wrong", "correct"]),
        feedback: FeedbackMessageSchema.optional(),
      })
    ),
    feedback: z.array(FeedbackMessageSchema),
  })
);

export const AnswerSchema = TaskAnswerSchema.merge(
  z.object({
    subtype: z.literal("fill-in-the-blank"),
    blanks: z.record(z.string()),
  })
);
