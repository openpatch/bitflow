import { Draft, produce } from "immer";
import {
  IAction,
  IAnswer,
  IAnswerAction,
  INoAction,
  ITaskState,
  IYesAction,
} from "./types";

export const initialState: ITaskState = {
  yes: false,
};

export const yesAction = (): IYesAction => ({
  type: "yes",
});

export const noAction = (): INoAction => ({
  type: "no",
});

export const answerAction = ({
  answer,
}: {
  answer: IAnswer;
}): IAnswerAction => ({
  type: "answer",
  payload: {
    answer,
  },
});

export const reducer = produce((draft: Draft<ITaskState>, action: IAction) => {
  switch (action.type) {
    case "yes":
      draft.yes = true;
      break;
    case "no":
      draft.yes = false;
      break;
    case "answer":
      return action.payload.answer;
  }
});
