import {
  Action as BaseAction,
  FeedbackMessage,
  TaskAnswer as BaseAnswer,
  TaskResult as BaseResult,
  TaskStatistic as BaseStatistic,
} from "@bitflow/base";
import { IOption, ITask } from "./schemas";

export interface ITaskState {
  checked: Partial<Record<IOption, boolean>>;
}

export interface IStatistic extends BaseStatistic {
  patterns: Partial<
    Record<
      string,
      {
        count: number;
        correct: boolean;
      }
    >
  >;
}

export interface IAnswer extends BaseAnswer {
  checked: ITaskState["checked"];
}

export interface IResult extends BaseResult {
  choices: Partial<
    Record<
      IOption,
      {
        state: "neutral" | "wrong" | "correct";
        feedback?: FeedbackMessage;
      }
    >
  >;
  feedback?: FeedbackMessage;
}

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
