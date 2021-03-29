import * as z from "zod";

export const FeedbackMessageSchema = z.object({
  message: z.string(),
  severity: z.enum(["error", "warning", "info", "success"]),
});

export type FeedbackMessage = z.infer<typeof FeedbackMessageSchema>;

export const TaskFeedbackSchema = z.object({});

export type TaskFeedback = z.infer<typeof TaskFeedbackSchema>;

export const TaskEvaluationSchema = z.object({
  mode: z.enum(["auto", "skip", "manual"]),
  enableRetry: z.boolean(),
  showFeedback: z.boolean(),
});

export type TaskEvaluation = z.infer<typeof TaskEvaluationSchema>;

export const TaskSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.enum(["choice", "input", "fill-in-the-blank"]),
  view: z.object({}),
  evaluation: TaskEvaluationSchema,
  feedback: TaskFeedbackSchema,
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskAnswerSchema = z.object({});

export type TaskAnswer = z.infer<typeof TaskAnswerSchema>;

export const TaskResultSchema = z.object({
  state: z.enum(["correct", "wrong", "unknown", "manual"]),
  allowRetry: z.boolean().optional(),
  feedback: z.any(),
});

export type TaskResult = z.infer<typeof TaskResultSchema>;

export const PrivacySchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.enum(["markdown"]),
  view: z.object({}),
});

export type Privacy = z.infer<typeof PrivacySchema>;

export const InputSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.enum(["markdown"]),
  view: z.object({}),
});

export type Input = z.infer<typeof InputSchema>;

export const TitleSchema = z.object({
  name: z.string(),
  description: z.string(),
  subtype: z.enum(["simple"]),
  view: z.object({}),
});

export type Title = z.infer<typeof TitleSchema>;
