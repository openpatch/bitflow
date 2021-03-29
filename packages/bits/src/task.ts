import {
  Evaluate,
  Task,
  TaskAnswer,
  TaskEvaluationFormProps,
  TaskFeedbackFormProps,
  TaskResult,
  TaskViewFormProps,
} from "@bitflow/base";
import * as choice from "@bitflow/task-choice";
import * as fillInTheBlank from "@bitflow/task-fill-in-the-blank";
import * as input from "@bitflow/task-input";
import { ReactElement } from "react";
import { union, ZodSchema } from "zod";

type TaskBit<
  T extends Task = any,
  A extends TaskAnswer = any,
  R extends TaskResult = any
> = {
  ViewForm: (props: TaskViewFormProps) => ReactElement | null;
  EvaluationForm: (props: TaskEvaluationFormProps) => ReactElement | null;
  FeedbackForm: (props: TaskFeedbackFormProps) => ReactElement | null;
  Task: (props: any) => ReactElement | null;
  TaskSchema: ZodSchema<T>;
  evaluate: Evaluate<A, T, R>;
};

const asTaskBit = <T>(et: { [K in keyof T]: TaskBit }) => et;

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
