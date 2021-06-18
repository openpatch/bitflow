import {
  FeedbackMessageSchema,
  TaskSchema as TaskSchemaBase,
} from "@bitflow/base";
import * as z from "zod";

export const TaskSchema = TaskSchemaBase.merge(
  z.object({
    subtype: z.enum(["fill-in-the-blank"]).default("fill-in-the-blank"),
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

export type ITask = z.infer<typeof TaskSchema>;
