import {
  Action as BaseAction,
  FeedbackMessage,
  TaskAnswer as BaseAnswer,
  TaskResult as BaseResult,
  TaskStatistic as BaseStatistic,
} from "@bitflow/base";

export interface ITaskState {
  input: string;
}

export interface IStatistic extends BaseStatistic {
  patterns: Record<
    string,
    {
      count: number;
    }
  >;
  inputs: Record<
    string,
    {
      correct: boolean;
      count: number;
    }
  >;
}

export interface IAnswer extends BaseAnswer {
  input: ITaskState["input"];
}

export interface IResult extends BaseResult {
  feedback?: FeedbackMessage[];
}

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
