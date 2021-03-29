import { TaskViewFormProps } from "@bitflow/base";
import { HookFormController, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import translations from "./locales.vocab";

export const ViewForm = ({ name }: TaskViewFormProps) => {
  const { t } = useTranslations(translations);

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
        name={`${name}.view.textWithBlanks`}
        label={t("text-with-blanks")}
        helperText={t("text-with-blanks-helper-text")}
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
    </Fragment>
  );
};
