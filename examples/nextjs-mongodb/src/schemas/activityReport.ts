import { ObjectId } from "bson";
import * as z from "zod";

const DescriptiveSchema = z.object({
  mean: z.number(),
  median: z.number(),
  max: z.number(),
  min: z.number(),
  lowerQuartile: z.number(),
  upperQuartile: z.number(),
  standardDeviation: z.number(),
  variance: z.number(),
  n: z.number(),
});

const TrySchema = z.object({
  tasks: z.record(
    DescriptiveSchema.extend({
      statistic: z.any(), // task dependent statistic
      rawScores: z.record(z.number()),
      potentialScores: z.record(z.number()),
      rawStates: z.record(
        z.object({
          tries: z.number(),
          state: z.enum(["correct", "wrong", "manual", "unknown"]), // session -> score
        })
      ),
      discriminationIndex: z.number(),
      difficulty: z.number(),
      states: z.object({
        correct: z.number(),
        wrong: z.number(),
        manual: z.number(),
        unknown: z.number(),
      }),
    })
  ),
  nodes: z.record(
    z.object({
      time: z.number(),
      n: z.number(),
      rawStatus: z.record(
        z.object({
          status: z.enum(["started", "finished", "skipped"]),
          tries: z.number(),
        })
      ),
      status: z.object({
        started: z.number(),
        finished: z.number(),
        skipped: z.number(),
      }),
    })
  ),
  model: z.object({
    latentVariables: z.record(
      DescriptiveSchema.extend({
        alpha: z.number(),
        rawScores: z.record(z.number()),
        potentialScores: z.record(z.number()),
      })
    ),
  }),
  overall: DescriptiveSchema.extend({
    rawScores: z.record(z.number()), // session -> score
    potentialScores: z.record(z.number()),
  }),
  time: z.number(), // in sec,
  correlation: z.array(
    z.object({
      node1: z.string(),
      node2: z.string(),
      pearson: z.number(),
    })
  ),
});

export type Try = z.infer<typeof TrySchema>;

export const ActivityReportSchema = z.object({
  _id: z.string(),
  activityId: z.string(),
  started: z.number(), // visited start node
  ended: z.number(), // visited end node
  tries: z.object({
    first: TrySchema,
    partial: TrySchema.extend({
      tries: z.number(),
    }),
    last: TrySchema.extend({
      tries: z.number(),
    }),
  }),
  usernames: z.record(z.string()),
  lastUpdate: z.string().optional(),
});

export type ActivityReport = z.infer<typeof ActivityReportSchema>;

export const ActivityReportDBSchema = ActivityReportSchema.extend({
  _id: z.instanceof(ObjectId),
  activityId: z.instanceof(ObjectId),
  lastUpdate: z.date().optional(),
});

export type ActivityReportDB = z.infer<typeof ActivityReportDBSchema>;
