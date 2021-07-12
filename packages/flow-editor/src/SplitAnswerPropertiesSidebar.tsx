import { Flow } from "@bitflow/core";
import { HookFormController, Input, Select } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const SplitAnswerPropertiesSidebar = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);
  const { watch } = useFormContext<Flow>();
  const nodes = watch("nodes", []);

  const taskNodes = nodes.filter((n) => n.type === "task");

  return (
    <HeaderSidebar header={t("split-answer-properties")}>
      {!taskNodes || taskNodes.length === 0 ? (
        t("add-bit-task-first")
      ) : (
        <Fragment>
          <HookFormController
            name={`${name}.nodeId`}
            label={t("task")}
            render={({ value, onChange, onBlur }) => (
              <Select value={value} onChange={onChange} onBlur={onBlur}>
                {taskNodes.map((t) => {
                  if (t.type === "task") {
                    return (
                      <option key={t.id} value={t.id}>
                        {t.data.name}
                      </option>
                    );
                  }
                  return null;
                })}
              </Select>
            )}
          />
          <HookFormController
            name={`${name}.key`}
            label={t("key")}
            render={Input}
          />
          <HookFormController
            name={`${name}.value`}
            label={t("value")}
            render={Input}
          />
        </Fragment>
      )}
    </HeaderSidebar>
  );
};
