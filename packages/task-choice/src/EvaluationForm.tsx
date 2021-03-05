import { EvaluationFormProps as EvaluationFormPropsBase } from "@openpatch/bits-base";
import { Box, AutoGrid, HookFormController } from "@openpatch/patches";
import { useFormContext } from "react-hook-form";
import { IEvaluation, ITask, Option, options } from "./types";
import { Choice } from "./Choice";

export interface EvaluationFormProps extends EvaluationFormPropsBase<ITask> {
  locales?: {
    correctChoices?: string;
  };
}

const defaultLocales: Required<EvaluationFormProps["locales"]> = {
  correctChoices: "Correct Choices",
};

export const EvaluationForm = ({ locales, task }: EvaluationFormProps) => {
  const { control } = useFormContext<IEvaluation>();
  return (
    <HookFormController
      name="correct"
      control={control}
      defaultValue={[]}
      label={locales?.correctChoices || defaultLocales.correctChoices}
      render={({ value, onChange }) => {
        const handleChange = (o: Option) => (v: boolean) => {
          if (v) {
            onChange([...value, o]);
          } else {
            onChange(value.filter((v: string) => v !== o));
          }
        };

        return (
          <Box mb="small">
            <AutoGrid gap="standard">
              {task.choices.map((c, i) => {
                const option = options[i];
                const checked = value.includes(option);
                return (
                  <Choice
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
