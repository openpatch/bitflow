import { TaskViewFormProps, uuidv4 } from "@bitflow/base";
import {
  AutoGrid,
  Box,
  ButtonGroup,
  ButtonOutline,
  ButtonSecondary,
  FormErrorText,
  HookFormController,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import {
  FieldError,
  get,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import translations from "./locales.vocab";
import { ITask, options } from "./schemas";

export const ViewForm = ({ name }: TaskViewFormProps) => {
  const { t } = useTranslations(translations);
  const { formState } = useFormContext<ITask>();
  const { fields, append, remove, move } = useFieldArray({
    name: `${name}.view.choices`,
    keyName: "fieldId",
  });

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
          {fields.map((choice, index) => (
            <HookFormController
              name={`${name}.view.choices[${index}].markdown`}
              key={choice.fieldId}
              label={t("choice", { option: options[index] })}
              defaultValue=""
              render={({ value, onChange, onBlur }) => (
                <Box width="100%" display="flex" alignItems="center">
                  <Box mr="small">
                    <ButtonGroup direction="vertical" attached>
                      {index !== 0 && (
                        <ButtonOutline
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        >
                          {t("up")}
                        </ButtonOutline>
                      )}
                      <ButtonOutline onClick={() => remove(index)}>
                        {t("delete")}
                      </ButtonOutline>
                      {index + 1 !== fields.length && (
                        <ButtonOutline
                          disabled={index + 1 === fields.length}
                          onClick={() => move(index, index + 1)}
                        >
                          {t("down")}
                        </ButtonOutline>
                      )}
                    </ButtonGroup>
                  </Box>
                  <Box flex="1">
                    <MarkdownEditor
                      value={value}
                      variant="input"
                      onChange={(_, v) => onChange(v)}
                      onBlur={onBlur}
                    />
                  </Box>
                </Box>
              )}
            />
          ))}
          <ButtonSecondary
            fullWidth
            onClick={() => append({ markdown: "", id: uuidv4() })}
          >
            {t("add")}
          </ButtonSecondary>
          {error && <FormErrorText>{t("one-choice-required")}</FormErrorText>}
        </AutoGrid>
      </Box>
    </Fragment>
  );
};
