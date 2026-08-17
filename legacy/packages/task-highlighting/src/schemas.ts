import {
  FeedbackMessageSchema,
  TaskAnswerSchema,
  TaskResultSchema,
  TaskSchema as TaskSchemaBase,
  TaskStatisticSchema,
} from "@bitflow/core";
import { z } from "zod";

const HighlightColorSchema = z.enum([
  "maroon",
  "orange",
  "blue",
  "lavender",
  "yellow",
]);

const ColorSchema = z.object({
  enabled: z.boolean(),
  label: z.string().optional(),
});

export const TaskSchema = TaskSchemaBase.merge(
  z.object({
    subtype: z.literal("highlighting"),
    view: z.object({
      instruction: z.string(),
      text: z.string(),
      // based on https://sashamaps.net/docs/resources/20-colors/ 99.99%
      colors: z.object({
        maroon: ColorSchema,
        orange: ColorSchema,
        blue: ColorSchema,
        lavender: ColorSchema,
        yellow: ColorSchema,
      }),
    }),
    evaluation: TaskSchemaBase.shape.evaluation.merge(
      z.object({
        cutoffs: z.object({
          maroon: z.number(),
          orange: z.number(),
          blue: z.number(),
          lavender: z.number(),
          yellow: z.number(),
        }),
        highlights: z.array(z.union([HighlightColorSchema, z.null()])),
      })
    ),
    feedback: z.object({
      highlightAgreement: z.boolean(),
      agreement: z
        .array(
          z.object({
            color: HighlightColorSchema,
            threshold: z.number(),
            feedback: FeedbackMessageSchema,
          })
        )
        .optional(),
    }),
  })
);

export const StatisticSchema = TaskStatisticSchema.merge(
  z.object({
    subtype: z.literal("highlighting"),
    avgAgreement: z.object({
      maroon: z.number(),
      orange: z.number(),
      blue: z.number(),
      lavender: z.number(),
      yellow: z.number(),
    }),
    highlights: z.object({
      maroon: z.array(z.number()),
      orange: z.array(z.number()),
      blue: z.array(z.number()),
      lavender: z.array(z.number()),
      yellow: z.array(z.number()),
    }),
  })
);

export const AnswerSchema = TaskAnswerSchema.merge(
  z.object({
    subtype: z.literal("highlighting"),
    highlights: z.array(z.union([HighlightColorSchema, z.null()])),
  })
);

export const ResultSchema = TaskResultSchema.merge(
  z.object({
    subtype: z.literal("highlighting"),
    agreement: z.object({
      maroon: z.number(),
      orange: z.number(),
      blue: z.number(),
      lavender: z.number(),
      yellow: z.number(),
    }),
    highlightsFeedback: z.array(
      z.union([z.enum(["correct", "wrong"]), z.null()])
    ),
  })
);
