import { FlowNode, FlowNodeProps } from "./FlowNode";
import { IFlowNode } from "./schemas";

export const BitNode = (
  node: Pick<IFlowNode, "type"> & {
    data?: any;
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
  }
) => {
  return (
    <FlowNode
      tone="blue"
      title={node.data?.name || ""}
      description={node.data?.description || ""}
      footerLeft={node.type || ""}
      footerRight={node.data?.subtype || ""}
      targetHandles={1}
      sourceHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
