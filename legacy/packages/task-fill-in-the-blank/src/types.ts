import { Action as BaseAction, TaskBit as TaskBitBase } from "@bitflow/core";
import { z } from "zod";
import {
  AnswerSchema,
  ResultSchema,
  StatisticSchema,
  TaskSchema,
} from "./schemas";

export interface ITaskState {
  blanks: Record<string, string>;
}

export type ITask = z.infer<typeof TaskSchema>;

export type IAnswer = z.infer<typeof AnswerSchema>;

export type IResult = z.infer<typeof ResultSchema>;

export type IStatistic = z.infer<typeof StatisticSchema>;

export interface IChangeBlankAction extends BaseAction {
  type: "change-blank";
  payload: {
    blank: string;
    value: string;
  };
}

export interface IAnswerAction extends BaseAction {
  type: "answer";
  payload: {
    answer: IAnswer;
  };
}

export type IAction = IChangeBlankAction | IAnswerAction;

export type TaskBit = TaskBitBase<ITask, IAnswer, IResult, IStatistic, IAction>;
