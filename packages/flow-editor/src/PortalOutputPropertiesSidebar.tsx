import { Flow, isFlowPortalInputNode } from "@bitflow/core";
import { HookFormController, MarkdownEditor, Select } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const PortalOutputPropertiesSidebar = ({
  name,
}: {
  name: `nodes.${number}`;
}) => {
  const { t } = useTranslations(translations);
  const { watch } = useFormContext<Flow>();
  const nodes = watch("nodes", []);

  const portalNodes = nodes.filter(isFlowPortalInputNode);

  return (
    <HeaderSidebar header={t("portal-properties")}>
      {!portalNodes || portalNodes.length === 0 ? (
        t("add-input-portal-first")
      ) : (
        <Fragment>
          <HookFormController
            name={`${name}.data.portal`}
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
        </Fragment>
      )}
    </HeaderSidebar>
  );
};
