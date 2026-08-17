import {
  StyledInput,
  Box,
  Heading,
  HookFormController,
  FormHelperText,
  FormLabel,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment, useEffect, useReducer } from "react";
import { useFormContext } from "react-hook-form";
import { IHighlightColor } from "./types";
import { HighlightText, HighlightTextProps } from "./HighlightText";
import translations from "./locales.vocab";
import {
  eraseAction,
  highlightAction,
  reducer,
  resetAction,
  selectAction,
} from "./reducer";
import { ITask, TaskBit } from "./types";

type HighlightsInputProps = {
  text: string;
  value: HighlightTextProps["highlights"];
  colors: HighlightTextProps["colors"];
  onChange: (value: HighlightTextProps["highlights"]) => void;
};

const HighlightsInput = ({
  text,
  value,
  colors,
  onChange,
}: HighlightsInputProps) => {
  const [state, dispatch] = useReducer(reducer, {
    highlights: value,
  });

  useEffect(() => {
    onChange(state.highlights);
  }, [state.highlights]);

  return (
    <HighlightText
      colors={colors}
      selection={state.selection}
      onErase={() => dispatch(eraseAction())}
      onSelect={(from, to) => dispatch(selectAction(from, to))}
      onReset={() => dispatch(resetAction())}
      onHighlight={(color) => () => dispatch(highlightAction(color))}
      text={text}
      highlights={value}
    />
  );
};

export const EvaluationForm: TaskBit["EvaluationForm"] = ({ name }) => {
  const { t } = useTranslations(translations);
  const { getValues } = useFormContext();
  const view = getValues(`${name}.view`) as ITask["view"];

  return (
    <Fragment>
      <FormLabel htmlFor="highlights">{t("solution")}</FormLabel>
      <FormHelperText>{t("instruction-solution")}</FormHelperText>
      <Box id="highlights" mt="standard" mb="standard">
        <HookFormController
          name={`${name}.evaluation.highlights`}
          defaultValue={false}
          render={({ value, onChange }) => (
            <HighlightsInput
              text={view.text}
              colors={view.colors}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Box>
      <FormLabel htmlFor="cutoffs">{t("cutoffs")}</FormLabel>
      <FormHelperText>{t("instruction-cutoffs")}</FormHelperText>
      <Box id="cutoffs" mt="standard">
        {Object.entries(view.colors)
          .filter(([_, v]) => v.enabled)
          .map(([k, v]) => (
            <HookFormController
              key={k}
              name={`${name}.evaluation.cutoffs.${k}`}
              label={v.label || t(k as IHighlightColor)}
              defaultValue={0}
              render={(props) => (
                <StyledInput
                  {...props}
                  type="number"
                  max={1}
                  min={-1}
                  step={0.1}
                />
              )}
            />
          ))}
      </Box>
    </Fragment>
  );
};
