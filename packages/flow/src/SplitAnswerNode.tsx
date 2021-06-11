import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode } from "./schemas";

export const SplitAnswerNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "split-answer";
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
    data?: FlowNodeProps;
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      {...node.data}
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
