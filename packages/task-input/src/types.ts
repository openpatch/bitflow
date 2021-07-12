import { Action as BaseAction, TaskBit as BaseTaskBit } from "@bitflow/core";
import { z } from "zod";
import {
  AnswerSchema,
  ResultSchema,
  StatisticSchema,
  TaskSchema,
} from "./schemas";

export interface ITaskState {
  input: string;
}

export type ITask = z.infer<typeof TaskSchema>;

export type IAnswer = z.infer<typeof AnswerSchema>;

export type IResult = z.infer<typeof ResultSchema>;

export type IStatistic = z.infer<typeof StatisticSchema>;

export interface IChangeAction extends BaseAction {
  type: "change";
  payload: {
    input: string;
  };
}

export interface IAnswerAction extends BaseAction {
  type: "answer";
  payload: {
    answer: IAnswer;
  };
}

export type IAction = IChangeAction | IAnswerAction;

export type TaskBit = BaseTaskBit<ITask, IAnswer, IResult, IStatistic, IAction>;
