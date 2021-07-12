import { HookFormController, Input } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const EvaluationForm: TaskBit["EvaluationForm"] = ({ name }) => {
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
