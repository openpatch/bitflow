import produce from "immer";
import { Answer, Result } from "@openpatch/bits-base/dist/types";
import { ConfidenceLevelsProps } from "../ConfidenceLevels";
import { IShellAction } from "./actions";

export type IState<A extends Answer, R extends Result> = {
  state:
    | "interact"
    | "evaluate"
    | "correct"
    | "wrong"
    | "retry"
    | "unknown"
    | "manual";
  answer?: A;
  result?: R;
  reasoning?: string;
  confidence?: ConfidenceLevelsProps["value"];
  nudge?: string;
};

export const initialState: IState<Answer, Result> = {
  state: "interact",
};

export const createReducer = <A extends Answer, R extends Result>() =>
  produce((draft: IState<A, R>, action: IShellAction<A, R>) => {
    switch (action.type) {
      case "next":
      case "skip":
      case "mouse-click":
      case "resize":
        // noop actions just for logging the interactions of a user
        break;
      case "reasoning-change":
        draft.reasoning = action.payload.reasoning;
        break;
      case "confidence-levels-change":
        draft.confidence = action.payload.level;
        break;
      case "result-receive":
        draft.result = action.payload.result;
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
        draft.state = "interact";
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
        draft.state = "retry";
        break;
      case "answer-change":
        draft.state = "interact";
        draft.answer = action.payload.answer;
        break;
    }
  });
