import { z, ZodSchema } from "zod";
import { TaskAnswerSchema, TaskResultSchema } from "./bitsSchema";
import { makeInteractiveFlowNodeSchema } from "./flowSchema";

type makeDoTrySchemaProps = {
  start: ZodSchema<Bitflow.Start>;
  end: ZodSchema<Bitflow.End>;
  input: ZodSchema<Bitflow.Input>;
  title: ZodSchema<Bitflow.Title>;
  task: ZodSchema<Bitflow.Task>;
};

export const makeDoBaseTrySchema = (flowNodeSchemas: makeDoTrySchemaProps) =>
  z.object({
    node: makeInteractiveFlowNodeSchema(flowNodeSchemas),
    startDate: z.date(),
    try: z.number(),
    status: z.string(),
  });

export const makeDoStartedTry = (flowNodeSchemas: makeDoTrySchemaProps) =>
  makeDoBaseTrySchema(flowNodeSchemas).merge(
    z.object({
      status: z.literal("started"),
    })
  );

export const makeDoFinishedTry = (flowNodeSchemas: makeDoTrySchemaProps) =>
  makeDoBaseTrySchema(flowNodeSchemas).merge(
    z.object({
      status: z.literal("finished"),
      endDate: z.date(),
      answer: TaskAnswerSchema.optional(),
      result: TaskResultSchema.optional(),
    })
  );

export const makeDoSkippedTry = (flowNodeSchemas: makeDoTrySchemaProps) =>
  makeDoBaseTrySchema(flowNodeSchemas).merge(
    z.object({
      status: z.literal("skipped"),
      endDate: z.date(),
    })
  );
