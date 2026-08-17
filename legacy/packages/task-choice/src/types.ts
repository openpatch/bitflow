import { Action as BaseAction, TaskBit as TaskBitBase } from "@bitflow/core";
import { z } from "zod";
import {
  AnswerSchema,
  IOption,
  ResultSchema,
  StatisticSchema,
  TaskSchema,
} from "./schemas";

export interface ITaskState {
  checked: Partial<Record<IOption, boolean>>;
}

export type ITask = z.infer<typeof TaskSchema>;

export type IStatistic = z.infer<typeof StatisticSchema>;

export type IResult = z.infer<typeof ResultSchema>;

export type IAnswer = z.infer<typeof AnswerSchema>;

export type TaskBit = TaskBitBase<ITask, IAnswer, IResult, IStatistic, IAction>;
export interface ICheckAction extends BaseAction {
  type: "check";
  payload: {
    choice: IOption;
    variant: ITask["view"]["variant"];
  };
}

export interface IUncheckAction extends BaseAction {
  type: "uncheck";
  payload: {
    choice: IOption;
    variant: ITask["view"]["variant"];
  };
}

export interface IAnswerAction extends BaseAction {
  type: "answer";
  payload: {
    answer: IAnswer;
  };
}

export type IAction = ICheckAction | IUncheckAction | IAnswerAction;
