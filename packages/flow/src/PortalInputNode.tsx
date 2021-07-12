import { FlowPortalInputNode } from "@bitflow/core";
import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const PortalInputNode = (
  node: Pick<FlowPortalInputNode, "data"> & {
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
      {...node.data}
      tone="portalBlue"
      title={node.data.portal}
      description={node.data.description}
      footerRight={t("portal-input")}
      sourceHandles={0}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
