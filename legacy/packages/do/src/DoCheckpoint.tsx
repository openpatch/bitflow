import { Shell, ShellContent, ShellFooter, ShellHeader } from "@bitflow/shell";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { DoPropsBase } from "./types";

export const DoCheckpoint = ({ onNext }: Pick<DoPropsBase, "onNext">) => {
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader>{t("checkpoint")}</ShellHeader>
      <ShellContent>{t("checkpoint-text")}</ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {t("continue")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
