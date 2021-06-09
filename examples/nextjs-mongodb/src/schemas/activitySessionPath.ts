import { TaskAnswerSchema, TaskResultSchema } from "@bitflow/base";
import { FlowNodePublicSchema } from "@bitflow/flow";
import { ObjectId } from "bson";
import * as z from "zod";

const ActivitySessionPathStartedSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  activitySessionId: z.string(),
  status: z.literal("started"),
  node: FlowNodePublicSchema,
  startDate: z.string(),
  try: z.number(),
});

const ActivitySessionPathStartedDBSchema = ActivitySessionPathStartedSchema.extend(
  {
    _id: z.instanceof(ObjectId),
    activityId: z.instanceof(ObjectId),
    activitySessionId: z.instanceof(ObjectId),
    startDate: z.date(),
  }
);

const ActivitySessionPathFinishedSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  activitySessionId: z.string(),
  status: z.literal("finished"),
  node: FlowNodePublicSchema,
  answer: TaskAnswerSchema,
  result: TaskResultSchema,
  startDate: z.string(),
  endDate: z.string(),
  try: z.number(),
});

const ActivitySessionPathFinishedDBSchema = ActivitySessionPathFinishedSchema.extend(
  {
    _id: z.instanceof(ObjectId),
    activityId: z.instanceof(ObjectId),
    activitySessionId: z.instanceof(ObjectId),
    startDate: z.date(),
    endDate: z.date(),
  }
);

const ActivitySessionPathSkippedSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  activitySessionId: z.string(),
  status: z.literal("skipped"),
  node: FlowNodePublicSchema,
  startDate: z.string(),
  endDate: z.string(),
  try: z.number(),
});

const ActivitySessionPathSkippedDBSchema = ActivitySessionPathSkippedSchema.extend(
  {
    _id: z.instanceof(ObjectId),
    activityId: z.instanceof(ObjectId),
    activitySessionId: z.instanceof(ObjectId),
    startDate: z.date(),
    endDate: z.date(),
  }
);

export const ActivitySessionPathSchema = z.union([
  ActivitySessionPathFinishedSchema,
  ActivitySessionPathSkippedSchema,
  ActivitySessionPathStartedSchema,
]);

export type ActivitySessionPath = z.infer<typeof ActivitySessionPathSchema>;

export const ActivitySessionPathDBSchema = z.union([
  ActivitySessionPathFinishedDBSchema,
  ActivitySessionPathSkippedDBSchema,
  ActivitySessionPathStartedDBSchema,
]);

export type ActivitySessionPathDB = z.infer<typeof ActivitySessionPathDBSchema>;
