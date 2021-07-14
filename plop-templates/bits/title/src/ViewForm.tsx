import { HookFormController, Input } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import translations from "./locales.vocab";
import { TitleBit } from "./types";

export const ViewForm: TitleBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.example`}
        label={t("example")}
        defaultValue=""
        render={Input}
      />
    </Fragment>
  );
};
