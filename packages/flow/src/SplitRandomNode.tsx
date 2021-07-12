import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const SplitRandomNode = (node: {
  hideHandles?: boolean;
  maxWidth?: FlowNodeProps["maxWidth"];
}) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="yellow"
      title={t("split-random")}
      description={t("split-random-helper-text")}
      sourceHandles={2}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
