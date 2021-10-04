import { HookFormController, NumberInput } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const SplitPointsPropertiesSidebar = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);

  return (
    <HeaderSidebar header={t("split-points-properties")}>
      <HookFormController
        name={`${name}.points`}
        label={t("split-points")}
        helperText={t("split-points-helper-text")}
        render={NumberInput}
      />
    </HeaderSidebar>
  );
};
