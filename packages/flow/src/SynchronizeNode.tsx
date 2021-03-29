import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode } from "./schemas";

export const SynchronizeNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "synchronize";
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="purple"
      title={t("synchronize")}
      description={t("synchronize-helper-text")}
      sourceHandles={1}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
