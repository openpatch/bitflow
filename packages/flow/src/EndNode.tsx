import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode } from "./schemas";

export const EndNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "end";
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      tone="red"
      title={t("end")}
      description={t("end-helper-text")}
      targetHandles={1}
      maxWidth={node.maxWidth}
    />
  );
};
