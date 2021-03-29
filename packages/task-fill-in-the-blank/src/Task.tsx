import { TaskProps, TaskRef } from "@bitflow/base";
import { css, Theme } from "@emotion/react";
import { AutoGrid, Box, Code, Markdown, useTheme } from "@openpatch/patches";
import produce, { Draft } from "immer";
import {
  createContext,
  Dispatch,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useReducer,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { Feedback } from "./Feedback";
import { ITask } from "./schemas";
import {
  IAction,
  IAnswer,
  IAnswerAction,
  IChangeBlankAction,
  IResult,
  ITaskState,
} from "./types";

// Initial State
export const initialState: ITaskState = {
  blanks: {},
};

// Events
export const changeBlankAction = ({
  value,
  blank,
}: {
  value: string;
  blank: string;
}): IChangeBlankAction => {
  return {
    type: "change-blank",
    payload: {
      blank,
      value,
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
    case "change-blank":
      draft.blanks[action.payload.blank] = action.payload.value;
      break;
    case "answer": {
      return action.payload.answer;
    }
  }
});

const blanksContext = createContext<{
  dispatch: Dispatch<IAction>;
  state: ITaskState;
  result?: IResult;
}>({
  state: initialState,
  dispatch: () => null,
});

const useBlank = (id: string) => {
  const { state, result, dispatch } = useContext(blanksContext);

  function onChange(value: string) {
    dispatch(changeBlankAction({ value, blank: id }));
  }

  return {
    state: state.blanks[id],
    result: result?.blanks[id],
    onChange,
  };
};

const CodeWithBlanks = ({
  value,
  language,
}: {
  value: string;
  language: string;
}) => {
  return <Code language={language}>{value}</Code>;
};

const Blank = ({ node }: { node: any }) => {
  const id = node?.children?.[0]?.value;

  if (!id) {
    return <input value="ERROR missing ID" />;
  }
  const { state, result, onChange } = useBlank(id);
  const [theme] = useTheme();
  const minWidth = 30;
  const [width, setWidth] = useState(minWidth);

  useEffect(() => {
    if (state) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.font = `${theme.fontSizes.standard} ${theme.fonts.body}`;
        const width = context.measureText(state).width;

        if (width > minWidth) {
          setWidth(width);
        }
      }
    } else {
      setWidth(minWidth);
    }
  }, [state]);

  return (
    <input
      css={(theme: Theme) => [
        css`
          display: inline-block;
          width: ${width}px;
        `,
        result?.state === "wrong" &&
          css`
            background-color: ${theme.colors.error["500"]};
          `,
      ]}
      value={state}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

const renderers = {
  delete: Blank,
  code: CodeWithBlanks,
};

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
      onChange({ blanks: state.blanks });
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

  const blanks = {};
  Object.entries(state.blanks).map(([k, b]) => {
    blanks[k] = {
      value: b,
    };
  });

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Markdown markdown={task.view.instruction} />
        <blanksContext.Provider
          value={{
            dispatch: customDispatch,
            state,
            result,
          }}
        >
          <ReactMarkdown
            plugins={[gfm]}
            renderers={renderers}
            children={task.view.textWithBlanks}
          />
        </blanksContext.Provider>
        {result?.feedback?.map((f, i) => (
          <Feedback key={i} {...f} />
        ))}
      </AutoGrid>
    </Box>
  );
});
