import { TaskAnswerSchema, TaskResultSchema } from "@bitflow/base";
import { ObjectId } from "bson";
import * as z from "zod";

export const ActivitySessionSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  points: z.number(),
  path: z.array(z.string()),
  submissions: z.record(
    z.array(
      z.object({
        result: TaskResultSchema,
        answer: TaskAnswerSchema,
      })
    )
  ),
});

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;

export const ActivitySessionDBSchema = ActivitySessionSchema.extend({
  _id: z.instanceof(ObjectId),
  activityId: z.instanceof(ObjectId),
});

export type ActivitySessionDB = z.infer<typeof ActivitySessionDBSchema>;
