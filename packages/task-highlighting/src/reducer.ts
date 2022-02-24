import { Draft, produce } from "immer";
import {
  IAction,
  IAnswer,
  IAnswerAction,
  ITaskState,
  IHighlightColor,
  IEraseAction,
  IHighlightAction,
  IResetAction,
  ISelectAction,
  IInitTextAction,
} from "./types";

export const initialState: ITaskState = {
  highlights: [],
};

export const eraseAction = (): IEraseAction => ({
  type: "erase",
});

export const highlightAction = (color: IHighlightColor): IHighlightAction => ({
  type: "highlight",
  payload: {
    color,
  },
});

export const resetAction = (): IResetAction => ({
  type: "reset",
});

export const selectAction = (from: number, to: number): ISelectAction => ({
  type: "select",
  payload: {
    from,
    to,
  },
});

export const initTextAction = (text: string): IInitTextAction => ({
  type: "init-text",
  payload: {
    text,
  },
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
    case "init-text":
      draft.highlights = new Array(action.payload.text.length).fill(null);
      break;
    case "reset":
      return {
        highlights: [...draft.highlights].fill(null),
      };
    case "erase":
      if (
        draft.selection?.from !== undefined &&
        draft.selection?.to !== undefined
      ) {
        draft.highlights = draft.highlights.fill(
          null,
          draft.selection.from,
          draft.selection.to
        );
        draft.selection = {
          from: 0,
          to: 0,
        };
      }
      break;
    case "select":
      draft.selection = action.payload;
      break;
    case "highlight":
      if (
        draft.selection?.from !== undefined &&
        draft.selection?.to !== undefined
      ) {
        draft.highlights = draft.highlights.fill(
          action.payload.color || draft.currentColor || null,
          draft.selection.from,
          draft.selection.to
        );
        draft.selection = {
          from: 0,
          to: 0,
        };
      }
      break;
    case "answer":
      return action.payload.answer;
  }
});
