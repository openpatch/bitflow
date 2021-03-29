import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode } from "./schemas";

export const SplitResultNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "split-result";
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="yellow"
      title={t("split-result")}
      description={t("split-result-helper-text")}
      sourceHandles={2}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
