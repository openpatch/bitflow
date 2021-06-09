import { ObjectId } from "bson";
import * as z from "zod";

export const ActivitySessionSchema = z.object({
  _id: z.string(),
  username: z.string().optional(),
  activityId: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  points: z.number(),
  deviceId: z.string(),
  updatedOn: z.string(),
  currentNodeIndex: z.number(),
});

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;

export const ActivitySessionDBSchema = ActivitySessionSchema.extend({
  _id: z.instanceof(ObjectId),
  activityId: z.instanceof(ObjectId),
  startDate: z.date(),
  endDate: z.date().optional(),
  deviceId: z.instanceof(ObjectId),
  updatedOn: z.date(),
});

export type ActivitySessionDB = z.infer<typeof ActivitySessionDBSchema>;
