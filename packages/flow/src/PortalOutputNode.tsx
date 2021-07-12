import { FlowPortalOutputNode } from "@bitflow/core";
import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const PortalOutputNode = (
  node: Pick<FlowPortalOutputNode, "data"> & {
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);

  return (
    <FlowNode
      {...node.data}
      tone="portalOrange"
      title={node.data.portal}
      description={node.data.description}
      sourceHandles={1}
      footerRight={t("portal-output")}
      targetHandles={0}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
