import { TaskEvaluationFormProps } from "@bitflow/base";
import { HookFormController, Input } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const EvaluationForm = ({ name }: TaskEvaluationFormProps) => {
  const { t } = useTranslations(translations);
  return (
    <HookFormController
      name={`${name}.evaluation.pattern`}
      defaultValue=""
      helperText={t("pattern-regex")}
      label={t("pattern")}
      render={Input}
    />
  );
};
