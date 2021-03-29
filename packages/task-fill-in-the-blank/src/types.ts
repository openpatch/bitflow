import {
  Action as BaseAction,
  FeedbackMessage,
  TaskAnswer as BaseAnswer,
  TaskResult as BaseResult,
  TaskStatistic as BaseStatistic,
} from "@bitflow/base";

export interface ITaskState {
  blanks: Record<string, string>;
}

export interface IStatistic extends BaseStatistic {
  blanks: Record<
    string,
    Record<
      string,
      {
        correct: boolean;
        count: number;
      }
    >
  >;
}

export interface IAnswer extends BaseAnswer {
  blanks: ITaskState["blanks"];
}

export interface IResult extends BaseResult {
  blanks: Record<
    string,
    {
      state: "neutral" | "wrong" | "correct";
      feedback?: FeedbackMessage;
    }
  >;
  feedback?: FeedbackMessage[];
}

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
