import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const CheckpointNode = (node: {
  hideHandles?: boolean;
  maxWidth?: FlowNodeProps["maxWidth"];
}) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="purple"
      title={t("checkpoint")}
      description={t("checkpoint-helper-text")}
      sourceHandles={1}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
