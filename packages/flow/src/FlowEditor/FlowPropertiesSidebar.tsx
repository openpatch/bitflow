import { HookFormController, Input, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "../locales.vocab";
import { HeaderSidebar } from "./HeaderSidebar";

export const FlowPropertiesSidebar = () => {
  const { t } = useTranslations(translations);

  return (
    <HeaderSidebar header={t("flow-properties")}>
      <HookFormController
        label={t("name")}
        name={"name"}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        label={t("description")}
        name="description"
        defaultValue=""
        render={({ value, onChange, onBlur }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(_, v) => onChange(v)}
            onBlur={onBlur}
          />
        )}
      />
    </HeaderSidebar>
  );
};
