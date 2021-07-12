import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const SynchronizeNode = (node: {
  hideHandles?: boolean;
  maxWidth?: FlowNodeProps["maxWidth"];
}) => {
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
