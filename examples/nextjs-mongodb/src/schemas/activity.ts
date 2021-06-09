import { FlowSchema } from "@bitflow/flow";
import { ObjectId } from "bson";
import * as z from "zod";

export const ActivitySchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  userId: z.string(),
  model: z.object({
    latentVariables: z.array(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string(),
        }),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        type: z.literal("latent-variable"),
      })
    ),
    nodes: z.record(
      z.object({
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    ),
    edges: z.array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
      })
    ),
  }),
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
  userId: z.instanceof(ObjectId),
});

export type ActivityDB = z.infer<typeof ActivityDBSchema>;
