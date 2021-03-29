import { TaskFeedbackFormProps } from "@bitflow/base";
import {
  Box,
  ButtonSecondary,
  Divider,
  Heading,
  HookFormController,
  Input,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import translations from "./locales.vocab";

export const FeedbackForm = ({ name }: TaskFeedbackFormProps) => {
  const { t } = useTranslations(translations);
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${name}.feedback.patterns`,
  });

  return (
    <Fragment>
      {fields.map((field, index) => (
        <Box mb="standard" key={field.id}>
          <Box display="flex" width="100%" alignItems="center">
            <Box flex="1">
              <Heading as="h3" fontSize="large">
                {t("pattern-title", { pattern: index.toString() })}
              </Heading>
            </Box>
            <ButtonSecondary tone="error" onClick={() => remove(index)}>
              {t("delete-pattern")}
            </ButtonSecondary>
          </Box>
          <HookFormController
            name={`${name}.feedback.patterns[${index}].pattern`}
            label={t("pattern")}
            defaultValue=""
            render={Input}
          />
          <HookFormController
            name={`${name}.feedback.patterns[${index}].feedback.message`}
            defaultValue=""
            label={t("message")}
            render={({ value, onChange, onBlur }) => (
              <MarkdownEditor
                value={value}
                variant="input"
                onChange={(_, value) => onChange(value)}
                onBlur={onBlur}
              />
            )}
          />
          <HookFormController
            name={`${name}.feedback.patterns[${index}].feedback.severity`}
            defaultValue="error"
            label={t("severity")}
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
      <Box mb="standard">
        <ButtonSecondary
          fullWidth
          onClick={() =>
            append({
              pattern: "",
              feedback: {
                severity: "error",
                message: "",
              },
            })
          }
        >
          {t("add-pattern")}
        </ButtonSecondary>
      </Box>
    </Fragment>
  );
};
