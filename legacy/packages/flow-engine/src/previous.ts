import { FlowEdge, FlowNode } from "@bitflow/core";
import { ensure } from "./types";

export type Previous = ({
  currentId,
  nodes,
  edges,
}: {
  currentId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) => Promise<FlowNode | null>;

export const previous: Previous = async ({ nodes, currentId, edges }) => {
  const currentNode = ensure(nodes.find((n) => n.id === currentId));

  if (currentNode.type === "portal-output") {
    const previousNode = nodes
      .filter((n) => n.type === "portal-input")
      .find((n) => {
        if (
          n.type === "portal-input" &&
          n.data.portal === currentNode.data.portal
        ) {
          return true;
        } else {
          return false;
        }
      });

    if (!previousNode) {
      return null;
    }

    return previous({ nodes, currentId: previousNode.id, edges });
  }

  const connectedEdges = edges.filter((e) => e.target === currentId);

  if (connectedEdges.length === 0) {
    return null;
  }

  const previousNode = ensure(
    nodes.find((n) => n.id === connectedEdges[0].source)
  );

  if (
    previousNode.type.includes("split-") ||
    previousNode.type === "portal-output" ||
    previousNode.type === "portal-input"
  ) {
    return previous({
      currentId: previousNode.id,
      nodes,
      edges,
    });
  } else if (previousNode.type === "synchronize") {
    return null;
  } else if (previousNode.type === "checkpoint") {
    return null;
  }
  return previousNode;
};
