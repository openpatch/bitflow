import { HookFormController, MarkdownEditor, Select } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import translations from "../locales.vocab";
import { IFlowNode } from "../schemas";
import { HeaderSidebar } from "./HeaderSidebar";

export const PortalOutputPropertiesSidebar = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);
  const { watch } = useFormContext();
  const nodes = watch("nodes", []) as IFlowNode[];

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
                      <option key={t.id} value={t.id}>
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
