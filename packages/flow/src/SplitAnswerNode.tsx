import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const SplitAnswerNode = (node: {
  hideHandles?: boolean;
  maxWidth?: FlowNodeProps["maxWidth"];
}) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="yellow"
      title={t("split-answer")}
      description={t("split-answer-helper-text")}
      sourceHandles={2}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
