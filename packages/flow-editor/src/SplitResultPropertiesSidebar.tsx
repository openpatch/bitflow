import { Flow, isFlowTaskNode } from "@bitflow/core";
import { HookFormController, Input, Select } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const SplitResultPropertiesSidebar = ({
  name,
}: {
  name: `nodes.${number}`;
}) => {
  const { t } = useTranslations(translations);
  const { watch } = useFormContext<Flow>();
  const nodes = watch("nodes", []);

  const taskNodes = nodes.filter(isFlowTaskNode);

  return (
    <HeaderSidebar header={t("split-result-properties")}>
      {taskNodes.length === 0 ? (
        t("add-bit-task-first")
      ) : (
        <Fragment>
          <HookFormController
            name={`${name}.data.nodeId`}
            label={t("task")}
            render={({ value, onChange, onBlur }) => (
              <Select value={value} onChange={onChange} onBlur={onBlur}>
                {taskNodes.map((t) => {
                  return (
                    <option key={t.id} value={t.id}>
                      {t.data.name}
                    </option>
                  );
                })}
              </Select>
            )}
          />
          <HookFormController
            name={`${name}.data.key`}
            label={t("key")}
            render={Input}
          />
          <HookFormController
            name={`${name}.data.value`}
            label={t("value")}
            render={Input}
          />
        </Fragment>
      )}
    </HeaderSidebar>
  );
};
