import { castDraft, Draft, produce } from "immer";
import { ConfidenceLevelsProps } from "../ConfidenceLevels";
import { IShellAction } from "./actions";

export type IState<
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult
> = {
  state:
    | "interact"
    | "evaluate"
    | "correct"
    | "wrong"
    | "skip"
    | "next"
    | "retry"
    | "allow-retry"
    | "previous"
    | "close"
    | "unknown"
    | "manual";
  answer?: A;
  result?: R;
  reasoning?: string;
  confidence?: ConfidenceLevelsProps["value"];
  nudge?: string;
};

export const initialState: IState<Bitflow.TaskAnswer, Bitflow.TaskResult> = {
  state: "interact",
};

export const createReducer = <
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult
>() =>
  produce((draft: Draft<IState<A, R>>, action: IShellAction<A, R>) => {
    switch (action.type) {
      case "mouse-click":
      case "resize":
        // noop actions just for logging the interactions of a user
        break;
      case "skip":
        draft.state = "skip";
        break;
      case "skip-error":
        draft.state = "interact";
        break;
      case "next":
        draft.state = "next";
        break;
      case "next-error":
        draft.state = "interact";
        break;
      case "previous":
        draft.state = "previous";
        break;
      case "previous-error":
        draft.state = "interact";
        break;
      case "close":
        draft.state = "close";
        break;
      case "close-error":
        draft.state = "interact";
        break;
      case "reasoning-change":
        draft.reasoning = action.payload.reasoning;
        break;
      case "confidence-levels-change":
        draft.confidence = action.payload.level;
        break;
      case "result-receive":
        draft.result = castDraft(action.payload.result);
        break;
      case "result-empty":
        draft.state = "interact";
        break;
      case "interact":
        draft.state = "interact";
        break;
      case "evaluate":
        draft.state = "evaluate";
        break;
      case "retry":
        draft.state = "retry";
        draft.result = undefined;
        break;
      case "correct-result-state":
        draft.state = "correct";
        draft.nudge = action.payload.nudge;
        break;
      case "wrong-result-state":
        draft.state = "wrong";
        draft.nudge = action.payload.nudge;
        break;
      case "unknown-result-state":
        draft.state = "unknown";
        draft.nudge = action.payload.nudge;
        break;
      case "manual-result-state":
        draft.state = "manual";
        draft.nudge = action.payload.nudge;
        break;
      case "retry-result-state":
        draft.state = "allow-retry";
        draft.nudge = action.payload.nudge;
        break;
      case "answer-change":
        draft.state = "interact";
        draft.answer = castDraft(action.payload.answer);
        break;
    }
    return draft;
  });
