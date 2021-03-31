import { TaskProps, TaskRef } from "@bitflow/base";
import { AutoGrid, Box, Markdown } from "@openpatch/patches";
import produce, { Draft } from "immer";
import { forwardRef, useEffect, useImperativeHandle, useReducer } from "react";
import { Choice } from "./Choice";
import { Feedback } from "./Feedback";
import { IOption, ITask, options } from "./schemas";
import {
  IAction,
  IAnswer,
  IAnswerAction,
  ICheckAction,
  IResult,
  ITaskState,
  IUncheckAction,
} from "./types";

// Initial State
export const initialState: ITaskState = {
  checked: {},
};

// Events
export const checkAction = ({
  choice,
  variant,
}: {
  choice: IOption;
  variant: ITask["view"]["variant"];
}): ICheckAction => {
  return {
    type: "check",
    payload: {
      choice,
      variant,
    },
  };
};

export const uncheckAction = ({
  choice,
  variant,
}: {
  choice: IOption;
  variant: ITask["view"]["variant"];
}): IUncheckAction => {
  return {
    type: "uncheck",
    payload: {
      choice,
      variant,
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
    case "check":
      if (action.payload.variant === "single") {
        draft.checked = {};
      }
      draft.checked[action.payload.choice] = true;
      break;
    case "uncheck":
      if (action.payload.variant === "single") {
        draft.checked = {};
      }
      draft.checked[action.payload.choice] = false;
      break;
    case "answer":
      return action.payload.answer;
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
      onChange({ checked: state.checked });
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

  const check = (choice: IOption) => {
    customDispatch(checkAction({ choice, variant: task.view.variant }));
  };

  const uncheck = (choice: IOption) => {
    customDispatch(uncheckAction({ choice, variant: task.view.variant }));
  };

  const handleChange = (choice: IOption) => (checked: boolean) => {
    if (checked) {
      check(choice);
    } else {
      uncheck(choice);
    }
  };

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Markdown markdown={task.view.instruction} />
        <AutoGrid columns={[1, 1, 2]} gap="standard">
          {task.view.choices
            .filter((c) => c.markdown)
            .map((choice, index) => (
              <Choice
                key={index}
                choice={choice?.markdown || ""}
                result={result?.choices[options[index]]}
                checked={state.checked[options[index]] || false}
                onChange={handleChange(options[index])}
              />
            ))}
        </AutoGrid>
        {result?.feedback && <Feedback {...result.feedback} />}
      </AutoGrid>
    </Box>
  );
});
