import { AutoGrid, Box, Heading } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { forwardRef, useEffect, useImperativeHandle, useReducer } from "react";
import { Feedback } from "./Feedback";
import translations from "./locales.vocab";
import { Option } from "./Option";
import {
  answerAction,
  initialState,
  noAction,
  reducer,
  yesAction,
} from "./reducer";
import { IAction, TaskBit } from "./types";

export const Task: TaskBit["Task"] = forwardRef(
  ({ task, mode, onAction, answer, onChange, result }, ref) => {
    const { t } = useTranslations(translations);
    const [state, dispatch] = useReducer(reducer, initialState);

    // only dispatch in default mode
    const customDispatch = (action: IAction) => {
      if (!(mode === "recording" || mode === "result")) {
        onAction?.(action);
        dispatch(action);
      }
    };

    // use the provided answer to override the state
    useEffect(() => {
      if (answer) dispatch(answerAction({ answer }));
    }, [answer]);

    // notify the outside world if a state change happens
    useEffect(() => {
      onChange?.({ subtype: "yes-no", yes: state.yes });
    }, [state.yes]);

    // needed for dispatching action from outside
    useImperativeHandle(ref, () => ({
      dispatch,
    }));

    return (
      <Box p="standard">
        <AutoGrid gap="standard">
          <Heading>{task.view.question}</Heading>
          <AutoGrid columns={2} gap="standard">
            <Option
              onChange={() => customDispatch(yesAction())}
              result={result}
              checked={state.yes}
            >
              {t("yes")}
            </Option>
            <Option
              onChange={() => customDispatch(noAction())}
              result={result}
              checked={!state.yes}
            >
              {t("no")}
            </Option>
          </AutoGrid>
          {result?.feedback && <Feedback {...result.feedback} />}
        </AutoGrid>
      </Box>
    );
  }
);
