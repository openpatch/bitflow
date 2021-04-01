import { useTranslations } from "@vocab/react";
import { FlowNode, FlowNodeProps } from "./FlowNode";
import translations from "./locales.vocab";
import { IFlowNode, IPortal } from "./schemas";

export const PortalOutputNode = (
  node: Pick<IFlowNode, "type"> & {
    type: "portal-output";
    data: IPortal;
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  const { t } = useTranslations(translations);

  return (
    <FlowNode
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
