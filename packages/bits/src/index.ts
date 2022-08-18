import * as StartSimple from "@bitflow/start-simple";
import * as EndTries from "@bitflow/end-tries";
import * as TaskChoice from "@bitflow/task-choice";
import * as TaskFillInTheBlank from "@bitflow/task-fill-in-the-blank";
import * as TaskHighlighting from "@bitflow/task-highlighting";
import * as TaskInput from "@bitflow/task-input";
import * as TaskYesNo from "@bitflow/task-yes-no";
import * as InputMarkdown from "@bitflow/input-markdown";
import * as TitleSimple from "@bitflow/title-simple";
import { z } from "zod";

export {
  StartSimple,
  EndTries,
  TaskChoice,
  TaskFillInTheBlank,
  TaskHighlighting,
  TaskInput,
  TaskYesNo,
  InputMarkdown,
  TitleSimple,
};

export const startBits = {
  simple: StartSimple,
} as const;

export type StartBitKey = keyof typeof startBits;

export const taskBits = {
  choice: TaskChoice,
  "fill-in-the-blank": TaskFillInTheBlank,
  highlighting: TaskHighlighting,
  input: TaskInput,
  "yes-no": TaskYesNo,
} as const;

export type TaskBitKey = keyof typeof taskBits;

export const inputBits = {
  markdown: InputMarkdown,
} as const;

export type InputBitKey = keyof typeof inputBits;

export const endBits = {
  tries: EndTries,
} as const;

export type EndBitKey = keyof typeof endBits;

export const titleBits = {
  simple: TitleSimple,
} as const;

export type TitleBitKey = keyof typeof titleBits;

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
    TaskFillInTheBlank.TaskSchema,
    TaskHighlighting.TaskSchema,
    TaskInput.TaskSchema,
    TaskYesNo.TaskSchema,
  ]),
};

export const evaluate = {
  choice: TaskChoice.evaluate,
  "fill-in-the-blank": TaskFillInTheBlank.evaluate,
  highlighting: TaskHighlighting.evaluate,
  input: TaskInput.evaluate,
  "yes-no": TaskYesNo.evaluate,
};

export const updateStatistic = {
  choice: TaskChoice.updateStatistic,
  "fill-in-the-blank": TaskFillInTheBlank.updateStatistic,
  highlighting: TaskHighlighting.updateStatistic,
  input: TaskInput.updateStatistic,
  "yes-no": TaskYesNo.updateStatistic,
};

export type Task =
  | TaskChoice.ITask
  | TaskFillInTheBlank.ITask
  | TaskHighlighting.ITask
  | TaskInput.ITask
  | TaskYesNo.ITask;
export type TaskResult =
  | TaskChoice.IResult
  | TaskFillInTheBlank.IResult
  | TaskHighlighting.IResult
  | TaskInput.IResult
  | TaskYesNo.IResult;
export type TaskStatistic =
  | TaskChoice.IStatistic
  | TaskFillInTheBlank.IStatistic
  | TaskHighlighting.IStatistic
  | TaskInput.IStatistic
  | TaskYesNo.IStatistic;
export type TaskAnswer =
  | TaskChoice.IAnswer
  | TaskFillInTheBlank.IAnswer
  | TaskHighlighting.IAnswer
  | TaskInput.IAnswer
  | TaskYesNo.IAnswer;

export type Input = InputMarkdown.IInput;

export type Title = TitleSimple.ITitle;

export type Start = StartSimple.IStart;

export type End = EndTries.IEnd;
