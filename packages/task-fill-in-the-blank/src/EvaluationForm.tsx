import { TaskEvaluationFormProps } from "@bitflow/base";
import { HookFormController, Input } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { ITask } from ".";
import translations from "./locales.vocab";

const blankRegex = /~~[A-z]+~~/g;

export const EvaluationForm = ({ name }: TaskEvaluationFormProps) => {
  const { t } = useTranslations(translations);
  const { getValues } = useFormContext();
  const textWithBlanks = getValues(
    `${name}.view.textWithBlanks`
  ) as ITask["view"]["textWithBlanks"];

  // extract blanks from text
  const blanks =
    textWithBlanks
      .match(blankRegex)
      ?.map((s) => s.substring(2, s.length - 2)) || [];

  return (
    <Fragment>
      {blanks.map((blank) => (
        <HookFormController
          key={blank}
          name={`${name}.evaluation.blanks.${blank}`}
          defaultValue=""
          helperText={t("pattern-regex-helper-text")}
          label={t("pattern-for-blank", { blank })}
          render={Input}
        />
      ))}
    </Fragment>
  );
};
