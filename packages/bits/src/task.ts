import {
  Evaluate,
  Task,
  TaskAnswer,
  TaskEvaluationFormProps,
  TaskFeedbackFormProps,
  TaskResult,
  TaskStatistic,
  TaskStatisticProps,
  TaskViewFormProps,
  UpdateTaskStatistic,
} from "@bitflow/base";
import * as choice from "@bitflow/task-choice";
import * as fillInTheBlank from "@bitflow/task-fill-in-the-blank";
import * as input from "@bitflow/task-input";
import { ReactElement } from "react";
import { union, ZodSchema } from "zod";

export type TaskBit<
  T extends Task = any,
  A extends TaskAnswer = any,
  R extends TaskResult = any,
  S extends TaskStatistic = any
> = {
  ViewForm: (props: TaskViewFormProps) => ReactElement | null;
  EvaluationForm: (props: TaskEvaluationFormProps) => ReactElement | null;
  FeedbackForm: (props: TaskFeedbackFormProps) => ReactElement | null;
  Task: (props: any) => ReactElement | null;
  Statistic: (props: TaskStatisticProps<S, T>) => ReactElement | null;
  updateStatistic: UpdateTaskStatistic<S, A, T, R>;
  TaskSchema: ZodSchema<T>;
  evaluate: Evaluate<A, T, R>;
};

export const asTaskBit = <T>(et: { [K in keyof T]: TaskBit }) => et;

export const taskBits = asTaskBit({
  "fill-in-the-blank": fillInTheBlank,
  choice,
  input,
});

export const TaskBitsSchema = union([
  choice.TaskSchema,
  input.TaskSchema,
  fillInTheBlank.TaskSchema,
]);

export const TaskBitsPublicSchema = union([
  choice.TaskSchema.pick({ name: true, subtype: true, view: true }),
  input.TaskSchema.pick({ name: true, subtype: true, view: true }),
  fillInTheBlank.TaskSchema.pick({ name: true, subtype: true, view: true }),
]);
