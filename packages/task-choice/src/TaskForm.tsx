import {
  useFieldArray,
  useFormContext,
  get,
  FieldError,
} from "react-hook-form";
import {
  Select,
  ButtonGroup,
  ButtonSecondary,
  ButtonOutline,
  HookFormController,
  Box,
  MarkdownEditor,
  AutoGrid,
  FormErrorText,
} from "@openpatch/patches";
import { ITask, options } from "./types";
import {
  TaskFormProps as TaskFormPropsBase,
  uuidv4,
} from "@openpatch/bits-base";
import { Fragment } from "react";

export interface TaskFormProps extends TaskFormPropsBase {
  locales?: {
    variantSingle?: string;
    variantMultiple?: string;
    up?: string;
    down?: string;
    delete?: string;
    add?: string;
    oneChoiceRequired?: string;
    choice?: (id: number) => string;
  };
}

const defaultLocales: Required<TaskFormProps["locales"]> = {
  variantSingle: "Single",
  variantMultiple: "Multiple",
  up: "Up",
  down: "Down",
  delete: "Delete",
  add: "Add Choice",
  oneChoiceRequired: "At least one choice is required!",
  choice: (id: number) => `Choice ${id}`,
};

export const TaskForm = ({ locales }: TaskFormProps) => {
  const { errors, control } = useFormContext<ITask>();
  const { fields, append, remove, move } = useFieldArray({
    name: "choices",
  });

  const error: FieldError = get(errors, "choices");

  return (
    <Fragment>
      <HookFormController
        name="variant"
        control={control}
        label="Variant"
        defaultValue="single"
        render={({ value, onChange, onBlur }) => (
          <Select value={value} onChange={onChange} onBlur={onBlur}>
            <option value="single">
              {locales?.variantSingle || defaultLocales.variantSingle}
            </option>
            <option value="multiple">
              {locales?.variantMultiple || defaultLocales.variantMultiple}
            </option>
          </Select>
        )}
      />
      <Box mt="standard">
        <AutoGrid gap="standard">
          {fields.map((choice, index) => (
            <HookFormController
              name={`choices[${index}].markdown`}
              key={choice.id}
              label={
                locales?.choice
                  ? locales.choice(index)
                  : defaultLocales.choice(index)
              }
              defaultValue=""
              control={control}
              render={({ value, onChange, onBlur }) => (
                <Box width="100%" display="flex" alignItems="center">
                  <Box mr="small">
                    <ButtonGroup direction="vertical" attached>
                      {index !== 0 && (
                        <ButtonOutline
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        >
                          {locales?.up || defaultLocales.up}
                        </ButtonOutline>
                      )}
                      <ButtonOutline onClick={() => remove(index)}>
                        {locales?.delete || defaultLocales.delete}
                      </ButtonOutline>
                      {index + 1 !== fields.length && (
                        <ButtonOutline
                          disabled={index + 1 === fields.length}
                          onClick={() => move(index, index + 1)}
                        >
                          {locales?.down || defaultLocales.down}
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
            {locales?.add || defaultLocales.add}
          </ButtonSecondary>
          {error && (
            <FormErrorText>
              {locales?.oneChoiceRequired || defaultLocales.oneChoiceRequired}
            </FormErrorText>
          )}
        </AutoGrid>
      </Box>
    </Fragment>
  );
};
