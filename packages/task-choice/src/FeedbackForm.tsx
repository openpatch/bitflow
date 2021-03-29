import { TaskFeedbackFormProps } from "@bitflow/base";
import {
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
import { useTranslations } from "@vocab/react";
import { Fragment, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import translations from "./locales.vocab";
import { IOption, ITask, options } from "./schemas";

export const FeedbackForm = ({ name }: TaskFeedbackFormProps) => {
  const { t } = useTranslations(translations);
  const { control, watch, getValues, setValue } = useFormContext();
  const defaultPatterns = getValues(
    `${name}.feedback.patterns`
  ) as ITask["feedback"]["patterns"];
  const [pattern, setPattern] = useState("");
  const [patterns, setPatterns] = useState<ITask["feedback"]["patterns"]>(
    defaultPatterns || {}
  );
  const [patternError, setPatternError] = useState<
    "exists" | "invalid" | "duplicate" | false
  >(false);
  const view = watch(`${name}.view`) as Partial<ITask["view"]> | undefined;

  useEffect(() => {
    validatePattern(pattern);
  }, [view, pattern]);

  function validatePattern(v: string) {
    if (!v) {
      return setPatternError("invalid");
    }
    const patternKeys: string[] = Object.keys(patterns);
    v = v.toLowerCase().split("").sort().join("");

    if (patternKeys.includes(v)) {
      setPatternError("exists");
      return;
    }

    const patternParts = v.split("");

    const taskOptions = view?.choices?.map((_, i) => options[i]) || [];

    for (let o of patternParts) {
      if (!taskOptions.includes(o as IOption)) {
        return setPatternError("invalid");
      }
    }

    if (new Set(v).size !== v.length) {
      return setPatternError("duplicate");
    }

    setPatternError(false);
  }

  function handlePatternChange(v: string) {
    setPattern(v.toLowerCase());
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
      {view?.choices?.map((choice, index) => {
        const option = options[index];
        return (
          <Fragment key={index}>
            <Heading as="h2" fontSize="large">
              {t("choice", { option })}
            </Heading>
            <HookFormController
              name={`${name}.feedback.choices.${option}.checkedFeedback.message`}
              defaultValue=""
              label={t("checked-feedback")}
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
              name={`${name}.feedback.choices.${option}.checkedFeedback.severity`}
              defaultValue="error"
              render={({ value, onChange, onBlur }) => (
                <Fragment>
                  <Select value={value} onChange={onChange} onBlur={onBlur}>
                    <option value="error">{t("error")}</option>
                    <option value="warning">{t("warning")}</option>
                    <option value="info">{t("info")}</option>
                    <option value="success">{t("success")}</option>
                  </Select>
                </Fragment>
              )}
            />
            <HookFormController
              name={`${name}.feedback.choices.${option}.notCheckedFeedback.message`}
              defaultValue=""
              label={t("not-checked-feedback")}
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
              name={`${name}.feedback.choices.${option}.notCheckedFeedback.severity`}
              defaultValue="error"
              render={({ value, onChange, onBlur }) => (
                <Fragment>
                  <Select value={value} onChange={onChange} onBlur={onBlur}>
                    <option value="error">{t("error")}</option>
                    <option value="warning">{t("warning")}</option>
                    <option value="info">{t("info")}</option>
                    <option value="success">{t("success")}</option>
                  </Select>
                </Fragment>
              )}
            />

            <Box my="standard" height="1px">
              <Divider />
            </Box>
          </Fragment>
        );
      })}

      {Object.keys(patterns).map((p) => (
        <Box mb="standard">
          <Box display="flex" width="100%" alignItems="center">
            <Box flex="1">
              <Heading as="h3" fontSize="large">
                {t("pattern", { pattern: p })}
              </Heading>
            </Box>
            <ButtonSecondary tone="error" onClick={handleDeletePattern(p)}>
              {t("delete-pattern")}
            </ButtonSecondary>
          </Box>
          <HookFormController
            name={`${name}.feedback.patterns.${p}.message`}
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
            name={`${name}.feedback.patterns.${p}.severity`}
            defaultValue="error"
            render={({ value, onChange, onBlur }) => (
              <Fragment>
                <Select value={value} onChange={onChange} onBlur={onBlur}>
                  <option value="error">{t("error")}</option>
                  <option value="warning">{t("warning")}</option>
                  <option value="info">{t("info")}</option>
                  <option value="success">{t("success")}</option>
                </Select>
              </Fragment>
            )}
          />
          <Box paddingY="standard">
            <Divider />
          </Box>
        </Box>
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
          {t("add-pattern")}
        </ButtonSecondary>
      </Box>
      {patternError === "invalid" && (
        <FormErrorText>{t("pattern-error-invalid")}</FormErrorText>
      )}
      {patternError === "duplicate" && (
        <FormErrorText>{t("pattern-error-duplicate")}</FormErrorText>
      )}
      {patternError === "exists" && (
        <FormErrorText>{t("pattern-error-exists")}</FormErrorText>
      )}
    </Fragment>
  );
};
