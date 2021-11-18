import { HookFormController, Input, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const PortalInputPropertiesSidebar = ({
  name,
}: {
  name: `nodes.${number}`;
}) => {
  const { t } = useTranslations(translations);

  return (
    <HeaderSidebar header={t("portal-properties")}>
      <HookFormController
        name={`${name}.data.portal`}
        label={t("portal")}
        render={Input}
      />
      <HookFormController
        name={`${name}.data.description`}
        label={t("description")}
        render={({ value, onChange }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(v) => onChange(v)}
          />
        )}
      />
    </HeaderSidebar>
  );
};
