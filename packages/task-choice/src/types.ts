import {
  Task as BaseTask,
  Evaluation as BaseEvaluation,
  Statistic as BaseStatistic,
  Answer as BaseAnswer,
  Result as BaseResult,
  Feedback as BaseFeedback,
  Action as BaseAction,
} from "@openpatch/bits-base";

export type Option = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

export const options: Option[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

export interface ITask extends BaseTask {
  variant: "multiple" | "single";
  // each array entry represents an option
  choices: Array<{
    id?: string;
    markdown?: string;
  }>;
}

export interface ITaskState {
  checked: Partial<Record<Option, boolean>>;
}

export type IEvaluation =
  | (BaseEvaluation & {
      correct: Array<Option>;
    })
  | (BaseEvaluation & {
      mode: "skip" | "manual";
    });
/**
 * For example, when someone answered a und b:
 * ab -> "You may have this misconception"
 */
export interface IFeedback extends BaseFeedback {
  patterns: Record<string, IFeedbackMessage>;
  choices: Partial<
    Record<
      Option,
      {
        checkedFeedback: IFeedbackMessage;
        notCheckedFeedback: IFeedbackMessage;
      }
    >
  >;
}

export interface IFeedbackMessage {
  message: string;
  severity: "info" | "warning" | "error" | "success";
}

export interface IStatistic extends BaseStatistic {
  patterns: Partial<
    Record<
      string,
      {
        count: number;
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
      Option,
      {
        state: "neutral" | "wrong" | "correct";
        feedback?: IFeedbackMessage;
      }
    >
  >;
  feedback?: IFeedbackMessage;
}

export interface ICheckAction extends BaseAction {
  type: "check";
  payload: {
    choice: Option;
    variant: ITask["variant"];
  };
}

export interface IUncheckAction extends BaseAction {
  type: "uncheck";
  payload: {
    choice: Option;
    variant: ITask["variant"];
  };
}

export interface IAnswerAction extends BaseAction {
  type: "answer";
  payload: {
    answer: IAnswer;
  };
}

export type IAction = ICheckAction | IUncheckAction | IAnswerAction;
