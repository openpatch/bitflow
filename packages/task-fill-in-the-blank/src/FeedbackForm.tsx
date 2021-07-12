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
import { ITask, TaskBit } from "./types";

const blankRegex = /~~[A-z]+~~/g;

export const BlankFeedbackForm = ({
  name,
  blank,
}: {
  name: string;
  blank: string;
}) => {
  const { t } = useTranslations(translations);
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${name}.feedback.blanks.${blank}.patterns`,
  });

  return (
    <Fragment>
      <Heading as="h2" fontSize="xlarge">
        {t("feedback-for-blank", { blank })}
      </Heading>
      {fields.map((field, index) => (
        <Box mb="standard" key={field.id}>
          <Box display="flex" width="100%" alignItems="center">
            <Box flex="1">
              <Heading as="h3" fontSize="large">
                {t("pattern", { pattern: index.toString() })}
              </Heading>
            </Box>
            <ButtonSecondary tone="error" onClick={() => remove(index)}>
              {t("delete-pattern")}
            </ButtonSecondary>
          </Box>
          <HookFormController
            name={`${name}.feedback.blanks.${blank}.patterns[${index}].pattern`}
            label={t("pattern-regex")}
            defaultValue=""
            render={Input}
          />
          <HookFormController
            name={`${name}.feedback.blanks.${blank}.patterns[${index}].feedback.message`}
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
            name={`${name}.feedback.blanks.${blank}.patterns[${index}].feedback.severity`}
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

export const FeedbackForm: TaskBit["FeedbackForm"] = ({ name }) => {
  const { getValues } = useFormContext();
  const textWithBlanks =
    (getValues(
      `${name}.view.textWithBlanks`
    ) as ITask["view"]["textWithBlanks"]) || "";

  // extract blanks from text
  const blanks =
    textWithBlanks
      .match(blankRegex)
      ?.map((s) => s.substring(2, s.length - 2)) || [];
  return (
    <Fragment>
      {blanks.map((blank) => (
        <BlankFeedbackForm key={blank} name={name} blank={blank} />
      ))}
    </Fragment>
  );
};
