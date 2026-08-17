import { HookFormController, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import translation from "./locales.vocab";
import { TaskBit } from "./types";

export const ViewForm: TaskBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translation);

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
    </Fragment>
  );
};
