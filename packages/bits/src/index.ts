import * as StartSimple from "@bitflow/start-simple"
import * as EndTries from "@bitflow/end-tries"
import * as TaskChoice from "@bitflow/task-choice"
import * as TaskFill from "@bitflow/task-fill-in-the-blank"
import * as TaskInput from "@bitflow/task-input"
import * as TaskYes from "@bitflow/task-yes-no"
import * as InputMarkdown from "@bitflow/input-markdown"
import * as TitleSimple from "@bitflow/title-simple"
import { z } from "zod";

export {
  StartSimple,
  EndTries,
  TaskChoice,
  TaskFill,
  TaskInput,
  TaskYes,
  InputMarkdown,
  TitleSimple,
};

export const startBits = {
  "simple": StartSimple,
} as const;

export type StartBitKey = keyof typeof startBits;

export const taskBits = {
  "choice": TaskChoice,
  "fill": TaskFill,
  "input": TaskInput,
  "yes": TaskYes,
} as const;

export type TaskBitKey = keyof typeof taskBits;

export const inputBits = {
  "markdown": InputMarkdown,
} as const;

export type InputBitKey = keyof typeof  inputBits;

export const endBits = {
  "tries": EndTries,
} as const;

export type EndBitKey = keyof  typeof endBits;

export const titleBits = {
  "simple": TitleSimple,
} as const;

export type TitleBitKey = keyof  typeof titleBits;

export const bits = {
  start: startBits,
  task: taskBits,
  end: endBits,
  title: titleBits,
  input: inputBits,
} as const;

export const schemas = {
  start: StartSimple.StartSchema,

  end: EndTries.EndSchema,

  title: TitleSimple.TitleSchema,

  input: InputMarkdown.InputSchema,

  task: z.union([
    TaskChoice.TaskSchema,
    TaskFill.TaskSchema,
    TaskInput.TaskSchema,
    TaskYes.TaskSchema,
  ]),
};

export const evaluate = {
  "choice": TaskChoice.evaluate,
  "fill": TaskFill.evaluate,
  "input": TaskInput.evaluate,
  "yes": TaskYes.evaluate,
};

export const updateStatistic = {
  "choice": TaskChoice.updateStatistic,
  "fill": TaskFill.updateStatistic,
  "input": TaskInput.updateStatistic,
  "yes": TaskYes.updateStatistic,
};

export type Task =
  | TaskChoice.ITask
  | TaskFill.ITask
  | TaskInput.ITask
  | TaskYes.ITask
;
export type TaskResult =
  | TaskChoice.IResult
  | TaskFill.IResult
  | TaskInput.IResult
  | TaskYes.IResult
;
export type TaskStatistic =
  | TaskChoice.IStatistic
  | TaskFill.IStatistic
  | TaskInput.IStatistic
  | TaskYes.IStatistic
;
export type TaskAnswer =
  | TaskChoice.IAnswer
  | TaskFill.IAnswer
  | TaskInput.IAnswer
  | TaskYes.IAnswer
;

export type Input =
  | InputMarkdown.IInput
;

export type Title =
  | TitleSimple.ITitle
;

export type Start =
  | StartSimple.IStart
;

export type End =
  | EndTries.IEnd
;
