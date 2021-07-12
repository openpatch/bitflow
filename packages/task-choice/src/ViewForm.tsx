import {
  AutoGrid,
  Box,
  FormErrorText,
  HookFormController,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { FieldError, get, useFormContext } from "react-hook-form";
import translations from "./locales.vocab";
import { options } from "./schemas";
import { ITask, TaskBit } from "./types";

export const ViewForm: TaskBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translations);
  const { formState } = useFormContext<ITask>();

  const error: FieldError = get(formState.errors, `${name}.choices`);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.instruction`}
        label={t("instruction")}
        defaultValue=""
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
        name={`${name}.view.variant`}
        label={t("variant")}
        defaultValue="single"
        render={({ value, onChange, onBlur }) => (
          <Select value={value} onChange={onChange} onBlur={onBlur}>
            <option value="single">{t("variant-single")}</option>
            <option value="multiple">{t("variant-multiple")}</option>
          </Select>
        )}
      />
      <Box mt="standard">
        <AutoGrid gap="standard">
          {options.map((o, index) => (
            <HookFormController
              name={`${name}.view.choices[${index}].markdown`}
              key={o}
              label={t("choice", { option: o })}
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
          ))}
          {error && <FormErrorText>{t("one-choice-required")}</FormErrorText>}
        </AutoGrid>
      </Box>
    </Fragment>
  );
};
