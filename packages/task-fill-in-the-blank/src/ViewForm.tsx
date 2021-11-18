import { HookFormController, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const ViewForm: TaskBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.instruction`}
        label={t("instruction")}
        defaultValue=""
        render={({ value, onChange }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(value) => onChange(value)}
          />
        )}
      />
      <HookFormController
        name={`${name}.view.textWithBlanks`}
        label={t("text-with-blanks")}
        helperText={t("text-with-blanks-helper-text")}
        defaultValue=""
        render={({ value, onChange }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(value) => onChange(value)}
          />
        )}
      />
    </Fragment>
  );
};
