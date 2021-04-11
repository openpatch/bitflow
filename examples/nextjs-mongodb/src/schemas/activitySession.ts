import { TaskAnswerSchema, TaskResultSchema } from "@bitflow/base";
import { FlowNodePublicSchema } from "@bitflow/flow";
import { ObjectId } from "bson";
import * as z from "zod";

export const ActivitySessionSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  points: z.number(),
  deviceId: z.string(),
  path: z.array(
    z.union([
      z.object({
        status: z.literal("started"),
        node: FlowNodePublicSchema,
        startDate: z.date(),
        try: z.number(),
      }),
      z.object({
        status: z.literal("finished"),
        node: FlowNodePublicSchema,
        answer: TaskAnswerSchema,
        result: TaskResultSchema,
        startDate: z.date(),
        endDate: z.date(),
        try: z.number(),
      }),
      z.object({
        status: z.literal("skipped"),
        node: FlowNodePublicSchema,
        startDate: z.date(),
        endDate: z.date(),
        try: z.number(),
      }),
    ])
  ),
  currentNodeIndex: z.number(),
});

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;

export const ActivitySessionDBSchema = ActivitySessionSchema.extend({
  _id: z.instanceof(ObjectId),
  activityId: z.instanceof(ObjectId),
  deviceId: z.instanceof(ObjectId),
});

export type ActivitySessionDB = z.infer<typeof ActivitySessionDBSchema>;
