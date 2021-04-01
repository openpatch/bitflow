import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode, IPortal } from "./schemas";

export const PortalInputNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "portal-input";
    data: IPortal;
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);
  return (
    <FlowNode
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
