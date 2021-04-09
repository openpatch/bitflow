import { FlowSchema } from "@bitflow/flow";
import { ObjectId } from "bson";
import * as z from "zod";

export const ActivitySchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  userId: z.string(),
  flow: FlowSchema,
  flowState: z.object({
    nodes: z.record(
      z.object({
        state: z.enum(["unlocked", "locked"]).optional(),
        allowRetry: z.boolean().optional(),
        showFeedback: z.boolean().optional(),
      })
    ),
  }),
});

export type Activity = z.infer<typeof ActivitySchema>;

export const ActivityDBSchema = ActivitySchema.extend({
  _id: z.instanceof(ObjectId),
});

export type ActivityDB = z.infer<typeof ActivityDBSchema>;
