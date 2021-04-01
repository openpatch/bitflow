import { HookFormController, Input, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "../locales.vocab";
import { HeaderSidebar } from "./HeaderSidebar";

export const PortalInputPropertiesSidebar = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);

  return (
    <HeaderSidebar header={t("portal-properties")}>
      <HookFormController
        name={`${name}.portal`}
        label={t("portal")}
        render={Input}
      />
      <HookFormController
        name={`${name}.description`}
        label={t("description")}
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
