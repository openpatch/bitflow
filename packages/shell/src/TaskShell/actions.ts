import { Action } from "@bitflow/core";
import { ConfidenceLevelsProps } from "../ConfidenceLevels";

export type ITaskAction<A extends Action = any> = A & {
  scope: "task";
};

export interface IShellActionBase {
  scope: "shell";
  type: string;
  payload: any;
}

export interface IEvaluateAction<A extends Bitflow.TaskAnswer>
  extends IShellActionBase {
  type: "evaluate";
  payload: {
    answer?: A;
  };
}

export const evaluateAction = <A extends Bitflow.TaskAnswer>({
  answer,
}: {
  answer?: A;
}): IEvaluateAction<A> => {
  return {
    type: "evaluate",
    scope: "shell",
    payload: {
      answer,
    },
  };
};

export interface IAnswerChangeAction<A extends Bitflow.TaskAnswer>
  extends IShellActionBase {
  type: "answer-change";
  payload: {
    answer: A;
  };
}

export const answerChangeAction = <A extends Bitflow.TaskAnswer>({
  answer,
}: {
  answer: A;
}): IAnswerChangeAction<A> => {
  return {
    type: "answer-change",
    scope: "shell",
    payload: {
      answer,
    },
  };
};

export interface IResultReceiveAction<R extends Bitflow.TaskResult>
  extends IShellActionBase {
  type: "result-receive";
  payload: {
    result: R;
  };
}

export const resultReceiveAction = <R extends Bitflow.TaskResult>({
  result,
}: {
  result: R;
}): IResultReceiveAction<R> => {
  return {
    type: "result-receive",
    scope: "shell",
    payload: {
      result,
    },
  };
};

export interface IResultEmptyAction extends IShellActionBase {
  type: "result-empty";
  payload: null;
}

export const resultEmptyAction = (): IResultEmptyAction => {
  return {
    type: "result-empty",
    scope: "shell",
    payload: null,
  };
};

export interface IWrongResultStateAction extends IShellActionBase {
  type: "wrong-result-state";
  payload: {
    nudge: string;
  };
}

export const wrongResultStateAction = ({
  nudge,
}: {
  nudge: string;
}): IWrongResultStateAction => {
  return {
    type: "wrong-result-state",
    scope: "shell",
    payload: {
      nudge,
    },
  };
};

export interface IManualResultStateAction extends IShellActionBase {
  type: "manual-result-state";
  payload: {
    nudge: string;
  };
}

export const manualResultStateAction = ({
  nudge,
}: {
  nudge: string;
}): IManualResultStateAction => {
  return {
    type: "manual-result-state",
    scope: "shell",
    payload: {
      nudge,
    },
  };
};

export interface IRetryResultStateAction extends IShellActionBase {
  type: "retry-result-state";
  payload: null;
}

export const retryResultStateAction = (): IRetryResultStateAction => {
  return {
    type: "retry-result-state",
    scope: "shell",
    payload: null,
  };
};

export interface ICorrectResultStateAction extends IShellActionBase {
  type: "correct-result-state";
  payload: {
    nudge: string;
  };
}

export const correctResultStateAction = ({
  nudge,
}: {
  nudge: string;
}): ICorrectResultStateAction => {
  return {
    type: "correct-result-state",
    scope: "shell",
    payload: { nudge },
  };
};

export interface IUnknownResultStateAction extends IShellActionBase {
  type: "unknown-result-state";
  payload: { nudge: string };
}

export const unknownResultStateAction = ({
  nudge,
}: {
  nudge: string;
}): IUnknownResultStateAction => {
  return {
    type: "unknown-result-state",
    scope: "shell",
    payload: { nudge },
  };
};

export interface INextAction extends IShellActionBase {
  type: "next";
  payload: null;
}

export const nextAction = (): INextAction => {
  return {
    type: "next",
    scope: "shell",
    payload: null,
  };
};

export interface INextErrorAction extends IShellActionBase {
  type: "next-error";
  payload: null;
}

export const nextErrorAction = (): INextErrorAction => {
  return {
    type: "next-error",
    scope: "shell",
    payload: null,
  };
};

export interface IRetryAction extends IShellActionBase {
  type: "retry";
  payload: null;
}

export const retryAction = (): IRetryAction => {
  return {
    type: "retry",
    scope: "shell",
    payload: null,
  };
};

export interface ISkipAction extends IShellActionBase {
  type: "skip";
  payload: null;
}

export const skipAction = (): ISkipAction => {
  return {
    type: "skip",
    scope: "shell",
    payload: null,
  };
};

export interface ISkipErrorAction extends IShellActionBase {
  type: "skip-error";
  payload: null;
}

export const skipErrorAction = (): ISkipErrorAction => {
  return {
    type: "skip-error",
    scope: "shell",
    payload: null,
  };
};

export interface IPreviousAction extends IShellActionBase {
  type: "previous";
  payload: null;
}

export const previousAction = (): IPreviousAction => {
  return {
    type: "previous",
    scope: "shell",
    payload: null,
  };
};

export interface IPreviousErrorAction extends IShellActionBase {
  type: "previous-error";
  payload: null;
}

export const previousErrorAction = (): IPreviousErrorAction => {
  return {
    type: "previous-error",
    scope: "shell",
    payload: null,
  };
};

export interface ICloseAction extends IShellActionBase {
  type: "close";
  payload: null;
}

export const closeAction = (): ICloseAction => {
  return {
    type: "close",
    scope: "shell",
    payload: null,
  };
};

export interface ICloseErrorAction extends IShellActionBase {
  type: "close-error";
  payload: null;
}

export const closeErrorAction = (): ICloseErrorAction => {
  return {
    type: "close-error",
    scope: "shell",
    payload: null,
  };
};

export interface IInteractAction extends IShellActionBase {
  type: "interact";
  payload: null;
}

export const interactAction = (): IInteractAction => {
  return {
    type: "interact",
    scope: "shell",
    payload: null,
  };
};

export interface IReasoningChangeAction extends IShellActionBase {
  type: "reasoning-change";
  payload: {
    reasoning: string;
  };
}

export const reasoningChangeAction = ({
  reasoning,
}: {
  reasoning: string;
}): IReasoningChangeAction => {
  return {
    type: "reasoning-change",
    scope: "shell",
    payload: { reasoning },
  };
};

export interface IConfidenceLevelsChangeAction extends IShellActionBase {
  type: "confidence-levels-change";
  payload: {
    level: ConfidenceLevelsProps["value"];
  };
}

export const confidenceLevelsChangeAction = ({
  level,
}: {
  level: ConfidenceLevelsProps["value"];
}): IConfidenceLevelsChangeAction => {
  return {
    type: "confidence-levels-change",
    scope: "shell",
    payload: { level },
  };
};

export interface IMouseClickAction extends IShellActionBase {
  type: "mouse-click";
  payload: {
    x: number;
    y: number;
  };
}

export const mouseClickAction = ({
  x,
  y,
}: {
  x: number;
  y: number;
}): IMouseClickAction => {
  return {
    type: "mouse-click",
    scope: "shell",
    payload: { x, y },
  };
};

export interface IResizeAction extends IShellActionBase {
  type: "resize";
  payload: {
    width: number;
    height: number;
  };
}

export const resizeAction = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): IResizeAction => {
  return {
    type: "resize",
    scope: "shell",
    payload: {
      width,
      height,
    },
  };
};

export type IShellAction<
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult
> =
  | IEvaluateAction<A>
  | IConfidenceLevelsChangeAction
  | IReasoningChangeAction
  | ICorrectResultStateAction
  | IWrongResultStateAction
  | IUnknownResultStateAction
  | IManualResultStateAction
  | IRetryResultStateAction
  | IResultReceiveAction<R>
  | IResultEmptyAction
  | IInteractAction
  | INextAction
  | INextErrorAction
  | IRetryAction
  | ISkipAction
  | ISkipErrorAction
  | ICloseAction
  | ICloseErrorAction
  | IPreviousAction
  | IPreviousErrorAction
  | IAnswerChangeAction<A>
  | IMouseClickAction
  | IResizeAction;
