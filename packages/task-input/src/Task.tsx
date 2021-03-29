import { TaskProps, TaskRef } from "@bitflow/base";
import { AutoGrid, Box, Input, Markdown } from "@openpatch/patches";
import produce, { Draft } from "immer";
import { forwardRef, useEffect, useImperativeHandle, useReducer } from "react";
import { Feedback } from "./Feedback";
import { ITask } from "./schemas";
import {
  IAction,
  IAnswer,
  IAnswerAction,
  IChangeAction,
  IResult,
  ITaskState,
} from "./types";

// Initial State
export const initialState: ITaskState = {
  input: "",
};

// Events
export const changeAction = ({ input }: { input: string }): IChangeAction => {
  return {
    type: "change",
    payload: {
      input,
    },
  };
};

export const answerAction = ({
  answer,
}: {
  answer: IAnswer;
}): IAnswerAction => {
  return {
    type: "answer",
    payload: {
      answer,
    },
  };
};

// Reducer
export const reducer = produce((draft: Draft<ITaskState>, action: IAction) => {
  switch (action.type) {
    case "change":
      draft.input = action.payload.input;
      break;
    case "answer": {
      return action.payload.answer;
    }
  }
});

// Task Component
export const Task = forwardRef<
  TaskRef<IAction>,
  TaskProps<ITask, IResult, IAnswer, IAction>
>(({ task, mode, result, answer, onChange, onAction }, ref) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const customDispatch = (action: IAction) => {
    if (!shouldDispatch()) return;
    if (onAction) {
      onAction(action);
    }
    dispatch(action);
  };

  useEffect(() => {
    if (answer) {
      dispatch(answerAction({ answer }));
    }
  }, [answer]);

  useEffect(() => {
    if (onChange) {
      onChange({ input: state.input });
    }
  }, [state]);

  useImperativeHandle(ref, () => ({
    dispatch,
  }));

  const shouldDispatch = () => {
    if (mode === "recording" || mode === "result") {
      return false;
    }
    return true;
  };

  const change = (value: string) => {
    customDispatch(changeAction({ input: value }));
  };

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Markdown markdown={task.view.instruction} />
        <Input
          error={result?.state === "wrong"}
          value={state.input}
          onChange={change}
        />
        {result?.feedback?.map((f, i) => (
          <Feedback key={i} {...f} />
        ))}
      </AutoGrid>
    </Box>
  );
});
