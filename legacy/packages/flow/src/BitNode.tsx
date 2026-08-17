import {
  FlowEndNode,
  FlowInputNode,
  FlowStartNode,
  FlowTaskNode,
  FlowTitleNode,
} from "@bitflow/core";
import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { Node } from "react-flow-renderer";

export const BitNode = (
  node: {
    hideHandles?: boolean;
    maxWidth?: FlowNodeProps["maxWidth"];
    disabled?: boolean;
  } & Pick<
    FlowStartNode | FlowEndNode | FlowInputNode | FlowTaskNode | FlowTitleNode,
    "type"
  > & {
      data: {
        count?: number;
        name: string;
        description: string;
        subtype: string;
      };
    }
) => {
  if (node.type === "start") {
    return (
      <FlowNode
        tone="teal"
        title={node.data?.name}
        count={node.data?.count}
        description={node.data?.description}
        sourceHandles={1}
        disabled={node?.disabled}
        footerLeft={node.type || ""}
        footerRight={node.data?.subtype || ""}
        hideHandles={node.hideHandles}
        maxWidth={node.maxWidth}
      />
    );
  } else if (node.type === "end") {
    return (
      <FlowNode
        tone="red"
        title={node.data?.name}
        disabled={node?.disabled}
        count={node.data?.count}
        description={node.data?.description}
        footerLeft={node.type || ""}
        footerRight={node.data?.subtype || ""}
        targetHandles={1}
        hideHandles={node.hideHandles}
        maxWidth={node.maxWidth}
      />
    );
  }
  return (
    <FlowNode
      tone="blue"
      title={node.data?.name || ""}
      count={node.data?.count}
      description={node.data?.description || ""}
      disabled={node?.disabled}
      footerLeft={node.type || ""}
      footerRight={node.data?.subtype || ""}
      targetHandles={1}
      sourceHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
