import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode } from "./schemas";

export const StartNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "start";
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="teal"
      title={t("start")}
      description={t("start-helper-text")}
      sourceHandles={1}
      maxWidth={node.maxWidth}
    />
  );
};
