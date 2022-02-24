import { AutoGrid, Box, Markdown } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { forwardRef, useEffect, useImperativeHandle, useReducer } from "react";
import { IHighlightColor } from "./types";
import { Feedback } from "./Feedback";
import { HighlightText } from "./HighlightText";
import translations from "./locales.vocab";
import {
  answerAction,
  eraseAction,
  highlightAction,
  initialState,
  initTextAction,
  reducer,
  resetAction,
  selectAction,
} from "./reducer";
import { IAction, TaskBit } from "./types";
import { colors } from "./colors";
import { css, Global } from "@emotion/react";

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

    useEffect(() => {
      if (task.view.text) {
        customDispatch(initTextAction(task.view.text));
      }
    }, []);

    // use the provided answer to override the state
    useEffect(() => {
      if (answer) dispatch(answerAction({ answer }));
    }, [answer]);

    // notify the outside world if a state change happens
    useEffect(() => {
      onChange?.({ subtype: "highlighting", highlights: state.highlights });
    }, [state.highlights]);

    // needed for dispatching action from outside
    useImperativeHandle(ref, () => ({
      dispatch,
    }));

    const handleSelect = (from: number, to: number) => {
      customDispatch(selectAction(from, to));
    };

    const handleHighlight = (color: IHighlightColor) => () => {
      customDispatch(highlightAction(color));
    };

    const handleErase = () => {
      customDispatch(eraseAction());
    };

    const handleReset = () => {
      customDispatch(resetAction());
    };
    //blue, lavender, maroon, orange and yellow
    let instruction = task.view.instruction;
    Object.entries(task.view.colors).forEach(([k, v]) => {
      instruction = instruction.replaceAll(
        `{{${k}}}`,
        `<mark id="${k}">${v.label || t(k as IHighlightColor)}</mark>`
      );
    });

    return (
      <Box p="standard">
        <Global
          styles={Object.entries(colors).map(
            ([k, v]) => css`
              #user-content-${k} {
                background-color: ${v.bg};
                color: ${v.fg};
                padding: 2px;
              }
            `
          )}
        />
        <AutoGrid gap="standard">
          <Markdown allowHtml markdown={instruction} />
          <HighlightText
            text={task.view.text}
            highlights={state.highlights}
            feedback={result?.highlightsFeedback}
            colors={task.view.colors}
            selection={state.selection}
            onHighlight={handleHighlight}
            onErase={handleErase}
            onReset={handleReset}
            onSelect={handleSelect}
          />
          {result?.feedback && <Feedback {...result.feedback} />}
        </AutoGrid>
      </Box>
    );
  }
);
