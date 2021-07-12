import { Flow } from "@bitflow/core";
import { HookFormController, MarkdownEditor, Select } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const PortalOutputPropertiesSidebar = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);
  const { watch } = useFormContext<Flow>();
  const nodes = watch("nodes", []);

  const portalNodes = nodes.filter((n) => n.type === "portal-input");

  return (
    <HeaderSidebar header={t("portal-properties")}>
      {!portalNodes || portalNodes.length === 0 ? (
        t("add-input-portal-first")
      ) : (
        <Fragment>
          <HookFormController
            name={`${name}.portal`}
            label={t("portal")}
            render={({ value, onChange, onBlur }) => (
              <Select value={value} onChange={onChange} onBlur={onBlur}>
                {portalNodes.map((t) => {
                  if (t.type === "portal-input") {
                    return (
                      <option key={t.data.portal} value={t.data.portal}>
                        {t.data.portal}
                      </option>
                    );
                  }
                  return null;
                })}
              </Select>
            )}
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
        </Fragment>
      )}
    </HeaderSidebar>
  );
};
