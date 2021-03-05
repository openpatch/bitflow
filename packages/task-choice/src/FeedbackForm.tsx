import { FeedbackFormProps as FeeedbackFormPropsBase } from "@openpatch/bits-base";
import {
  AutoGrid,
  Box,
  ButtonSecondary,
  Divider,
  FormErrorText,
  Heading,
  HookFormController,
  Input,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";
import { IEvaluation, IFeedback, ITask, Option, options } from "./types";

export interface FeedbackFormProps
  extends FeeedbackFormPropsBase<ITask, IEvaluation> {
  locales?: {
    choice?: (option: Option) => string;
    checkedFeedback?: string;
    notCheckedFeedback?: string;
    patterns?: string;
    addPattern?: string;
    deletePattern?: string;
    pattern?: (p: string) => string;
    patternErrorInvalid?: string;
    patternErrorDuplicate?: string;
    patternErrorExists?: string;
  };
}

const defaultLocales: Required<FeedbackFormProps["locales"]> = {
  choice: (option) => `Choice ${option.toUpperCase()}`,
  checkedFeedback: "Checked Feeedback",
  notCheckedFeedback: "Not Checked Feedback",
  patterns: "Patterns",
  addPattern: "Add Pattern",
  deletePattern: "Delete",
  pattern: (p) => `Pattern ${p.toUpperCase()}`,
  patternErrorInvalid: "Not a valid pattern",
  patternErrorDuplicate: "A pattern can not contain duplicates",
  patternErrorExists: "This pattern already exists",
};

export const FeedbackForm = ({
  locales,
  task,
  evaluation,
}: FeedbackFormProps) => {
  const { control, getValues, setValue } = useFormContext<IFeedback>();
  const defaultPatterns = getValues("patterns");
  const [pattern, setPattern] = useState("");
  const [patterns, setPatterns] = useState(defaultPatterns || {});
  const [patternError, setPatternError] = useState<
    "exists" | "invalid" | "duplicate" | false
  >(false);

  function handlePatternChange(v: string) {
    setPattern(v.toLowerCase());

    const patternKeys: string[] = Object.keys(patterns);
    v = v.toLowerCase().split("").sort().join("");

    if (patternKeys.includes(v)) {
      setPatternError("exists");
      return;
    }

    const patternParts = v.split("");

    const taskOptions = task.choices.map((_, i) => options[i]);

    for (let o of patternParts) {
      if (!taskOptions.includes(o as Option)) {
        return setPatternError("invalid");
      }
    }

    if (new Set(v).size !== v.length) {
      return setPatternError("duplicate");
    }

    setPatternError(false);
  }

  function handleAddPattern() {
    if (!patternError) {
      setPatterns((p) => ({
        ...p,
        [pattern]: {
          message: "",
          severity: "error",
        },
      }));
    }
  }

  const handleDeletePattern = (p: string) => () => {
    delete patterns[p];
    setValue("patterns", patterns);
    setPatterns(patterns);
  };

  return (
    <Fragment>
      {task.choices.map((choice, index) => {
        const option = options[index];
        return (
          <Fragment key={index}>
            <Heading as="h2" fontSize="large">
              {locales?.choice
                ? locales.choice(option)
                : defaultLocales.choice(option)}
            </Heading>
            <HookFormController
              name={`choices.${option}.checkedFeedback.message`}
              control={control}
              defaultValue=""
              label={locales?.checkedFeedback || defaultLocales.checkedFeedback}
              render={({ value, onChange, onBlur }) => (
                <MarkdownEditor
                  value={value}
                  variant="input"
                  onChange={(_, v) => onChange(v)}
                  onBlur={onBlur}
                />
              )}
            />
            <HookFormController
              name={`choices.${option}.notCheckedFeedback.message`}
              control={control}
              defaultValue=""
              label={
                locales?.notCheckedFeedback || defaultLocales.notCheckedFeedback
              }
              render={({ value, onChange, onBlur }) => (
                <MarkdownEditor
                  value={value}
                  variant="input"
                  onChange={(_, v) => onChange(v)}
                  onBlur={onBlur}
                />
              )}
            />

            <Box my="standard" height="1px">
              <Divider />
            </Box>
          </Fragment>
        );
      })}

      {Object.keys(patterns).map((p) => (
        <AutoGrid gap="small" key={p}>
          <Box display="flex" width="100%" alignItems="center">
            <Box flex="1">
              <Heading as="h3" fontSize="large">
                {locales?.pattern
                  ? locales.pattern(p)
                  : defaultLocales.pattern(p)}
              </Heading>
            </Box>
            <ButtonSecondary tone="error" onClick={handleDeletePattern(p)}>
              {locales?.deletePattern || defaultLocales.deletePattern}
            </ButtonSecondary>
          </Box>
          <HookFormController
            name={`patterns.${p}.message`}
            control={control}
            defaultValue=""
            render={({ value, onChange, onBlur }) => (
              <MarkdownEditor
                value={value}
                variant="input"
                onChange={(_, v) => onChange(v)}
                onBlur={onBlur}
              />
            )}
          />
          <HookFormController
            key={p}
            name={`patterns.${p}.severity`}
            control={control}
            defaultValue="error"
            render={({ value, onChange, onBlur }) => (
              <Fragment>
                <Select value={value} onChange={onChange} onBlur={onBlur}>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                </Select>
              </Fragment>
            )}
          />
          <Divider />
        </AutoGrid>
      ))}
      <Box display="flex" marginY="standard">
        <Box flex="1" mr="small">
          <Input
            error={patternError !== false}
            onChange={handlePatternChange}
            value={pattern}
          />
        </Box>
        <ButtonSecondary
          disabled={patternError !== false}
          onClick={handleAddPattern}
        >
          {locales?.addPattern || defaultLocales.addPattern}
        </ButtonSecondary>
      </Box>
      {patternError === "invalid" && (
        <FormErrorText>
          {locales?.patternErrorInvalid || defaultLocales.patternErrorInvalid}
        </FormErrorText>
      )}
      {patternError === "duplicate" && (
        <FormErrorText>
          {locales?.patternErrorDuplicate ||
            defaultLocales.patternErrorDuplicate}
        </FormErrorText>
      )}
      {patternError === "exists" && (
        <FormErrorText>
          {locales?.patternErrorExists || defaultLocales.patternErrorExists}
        </FormErrorText>
      )}
    </Fragment>
  );
};
