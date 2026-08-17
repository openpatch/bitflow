import * as z from "zod";

export const FeedbackMessageSchema = z.object({
  message: z.string(),
  severity: z.enum(["error", "warning", "info", "success"]),
});

export const TaskSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  subtype: z.string(),
  view: z.record(z.any()),
  evaluation: z.object({
    mode: z.enum(["auto", "skip", "manual"]),
    enableRetry: z.boolean(),
    showFeedback: z.boolean(),
  }),
  feedback: z.record(z.any()).optional(),
});

export const TaskStatisticSchema = z.object({
  subtype: z.string(),
  count: z.number(),
});

export const TaskAnswerSchema = z.object({
  subtype: z.string(),
});

export const TaskResultSchema = z.object({
  subtype: z.string(),
  state: z.enum(["unknown", "manual", "correct", "wrong"]),
  allowRetry: z.boolean().optional(),
  feedback: z.any(),
});

export const InputSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.string(),
  view: z.object({}),
});

export const TitleSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.string(),
  view: z.object({}),
});

export const StartSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.string(),
  view: z.object({}),
});

export const EndSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.string(),
  view: z.object({}),
});
