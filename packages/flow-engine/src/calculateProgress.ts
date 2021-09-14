import { FlowEdge, FlowNode } from "@bitflow/core";

export type CalculateProgress = ({
  nodes,
  edges,
  currentId,
  mode,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  currentId: string;
  mode?: "pessimistic" | "optimistic";
}) => Promise<number>;

/**
 *
 * @returns the number of hops to the end. In pessimistic mode the maximum
 * number of hops and in optimisitc mode the minimum number of hops. If there is
 * no way to the end infinity is returned.
 *
 */
export const calculateProgress: CalculateProgress = async ({
  nodes,
  edges,
  currentId,
  mode = "pessimistic",
}) => {
  const currentNode = nodes.find((n) => n.id === currentId);
  if (!currentNode) {
    return 100;
  }
  const visited: Record<string, boolean> = {};

  /**
   * If we want a smart mode, we need to have access to the answer, results and
   * points.
   */
  function calculateDistance(currentNode: FlowNode, distance: number): number {
    if (currentNode.type === "end") {
      // this is what we are looking for. A path to the end
      return distance;
    } else if (visited[currentNode.id] === true) {
      // we found a loop stop.
      return Number.POSITIVE_INFINITY;
    }

    visited[currentNode.id] = true;

    // get all edges, which come out of the current node
    const sourceEdges = edges
      .filter((e) => e.source === currentNode.id)
      .sort((a, b) => {
        if (a?.sourceHandle && b?.sourceHandle) {
          return a.sourceHandle > b.sourceHandle ? 1 : -1;
        }
        return 1;
      });

    // find the outgoing nodes
    const outgoers = sourceEdges
      .map((e) =>
        nodes.find((n) => {
          if (n.id === e.target) {
            return n;
          }
        })
      )
      .map((n) => {
        // replace input portals with their matching output
        if (n && n.type === "portal-input") {
          const portal = nodes.find(
            (m) => m.type === "portal-output" && m.data.portal === n.data.portal
          );
          return portal;
        }
        return n;
      }) as FlowNode[];

    // the node is a dead end
    if (outgoers.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    const distances = [];
    for (const outgoer of outgoers) {
      distances.push(calculateDistance(outgoer, distance + 1));
    }

    if (mode === "optimistic") {
      return Math.min(
        ...distances.filter(Number.isFinite),
        Number.POSITIVE_INFINITY
      );
    } else {
      return Math.max(
        ...distances.filter(Number.isFinite),
        Number.NEGATIVE_INFINITY
      );
    }
  }

  return calculateDistance(currentNode, 0);
};
