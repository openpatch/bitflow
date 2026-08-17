import { HookFormController, Input } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const ViewForm: TaskBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.question`}
        label={t("question")}
        defaultValue=""
        render={Input}
      />
    </Fragment>
  );
};
