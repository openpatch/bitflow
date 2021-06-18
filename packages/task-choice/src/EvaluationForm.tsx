import { TaskEvaluationFormProps } from "@bitflow/base";
import { AutoGrid, Box, HookFormController } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useFormContext } from "react-hook-form";
import { Choice } from "./Choice";
import translations from "./locales.vocab";
import { IOption, ITask, options } from "./schemas";

export const EvaluationForm = ({ name }: TaskEvaluationFormProps) => {
  const { control, watch } = useFormContext();
  const view = watch(`${name}.view`) as Partial<ITask["view"]>;
  const { t } = useTranslations(translations);
  return (
    <HookFormController
      name={`${name}.evaluation.correct`}
      defaultValue={[]}
      label={t("correct-choices")}
      render={({ value, onChange }) => {
        const handleChange = (o: IOption) => (v: boolean) => {
          if (v) {
            onChange([...value, o]);
          } else {
            onChange(value.filter((v: string) => v !== o));
          }
        };

        return (
          <Box mb="small">
            <AutoGrid gap="standard">
              {view?.choices
                ?.filter((c) => c.markdown)
                .map((c, i) => {
                  const option = options[i];
                  const checked = value.includes(option);
                  return (
                    <Choice
                      key={option}
                      checked={checked}
                      onChange={handleChange(option)}
                      choice={c.markdown || ""}
                    />
                  );
                })}
            </AutoGrid>
          </Box>
        );
      }}
    />
  );
};
