import { Action as BaseAction, TaskBit as TaskBitBase } from "@bitflow/core";
import { z } from "zod";
import {
  AnswerSchema,
  ResultSchema,
  StatisticSchema,
  TaskSchema,
} from "./schemas";

export type IHighlightColor =
  | "maroon"
  | "orange"
  | "blue"
  | "lavender"
  | "yellow";

export type ITaskState = {
  highlights: (IHighlightColor | null)[];
  selection?: {
    from: number;
    to: number;
  };
  currentColor?: IHighlightColor;
};

export type ITask = z.infer<typeof TaskSchema>;

export type IAnswer = z.infer<typeof AnswerSchema>;

export type IResult = z.infer<typeof ResultSchema>;

export type IStatistic = z.infer<typeof StatisticSchema>;

export interface IInitTextAction extends BaseAction {
  type: "init-text";
  payload: {
    text: string;
  };
}

export interface ISelectAction extends BaseAction {
  type: "select";
  payload: {
    from: number;
    to: number;
  };
}

export interface IHighlightAction extends BaseAction {
  type: "highlight";
  payload: {
    color: IHighlightColor;
  };
}

export interface IEraseAction extends BaseAction {
  type: "erase";
}

export interface IResetAction extends BaseAction {
  type: "reset";
}

export interface IAnswerAction extends BaseAction {
  type: "answer";
  payload: {
    answer: IAnswer;
  };
}

export type IAction =
  | IInitTextAction
  | ISelectAction
  | IHighlightAction
  | IEraseAction
  | IResetAction
  | IAnswerAction;

export type TaskBit = TaskBitBase<ITask, IAnswer, IResult, IStatistic, IAction>;
