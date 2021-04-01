import { TaskAnswer, TaskResult } from "@bitflow/base";
import _get from "lodash.get";
import {
  ICondition,
  IFlowEdge,
  IFlowNode,
  IPrimitiveCondition,
} from "./schemas";

export type GetAnswers = (
  nodeIds: string[]
) => Promise<Record<string, TaskAnswer>>;
export type GetResults = (
  nodeIds: string[]
) => Promise<Record<string, TaskResult>>;
export type GetPoints = () => Promise<number>;

function ensure<T>(
  argument: T | undefined | null,
  message: string = "This value was promised to be there."
): T {
  if (argument === undefined || argument === null) {
    throw new TypeError(message);
  }

  return argument;
}

export type Previous = ({
  currentId,
  nodes,
  edges,
}: {
  currentId: string;
  nodes: IFlowNode[];
  edges: IFlowEdge[];
}) => Promise<IFlowNode | null>;

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

export type Next = ({
  currentId,
  nodes,
  edges,
  getAnswers,
  getResults,
  getPoints,
}: {
  currentId: string;
  nodes: IFlowNode[];
  edges: IFlowEdge[];
  getAnswers: GetAnswers;
  getResults: GetResults;
  getPoints: GetPoints;
}) => Promise<IFlowNode | null>;

export const next: Next = async ({
  nodes,
  currentId,
  edges,
  getAnswers,
  getResults,
  getPoints,
}) => {
  let currentNode = ensure(nodes.find((n) => n.id === currentId));

  if (currentNode.type === "portal-input") {
    currentNode = await processPortalInput({ currentNode, nodes });
  }
  // outgoers need to be sorted based on the source handle to ensure the same
  // result regardsless of position in the nodes array.
  const sourceEdges = edges
    .filter((e) => e.source === currentNode.id)
    .sort((a, b) => {
      if (a?.sourceHandle && b?.sourceHandle) {
        return a.sourceHandle > b.sourceHandle ? 1 : -1;
      }
      return 1;
    });
  const outgoers = sourceEdges.map((e) =>
    nodes.find((n) => n.id === e.target)
  ) as IFlowNode[];

  // if no outgoers is found the end is reached.
  if (outgoers.length === 0) {
    // the end
    return null;
  }

  let nextNode: IFlowNode;
  switch (currentNode.type) {
    case "task":
    case "input":
    case "title":
    case "start":
    case "checkpoint":
    case "synchronize":
    case "portal-output":
      nextNode = await processLinear({ outgoers });
      break;
    case "split-answer": {
      nextNode = await processSplitAnswer({
        currentNode,
        outgoers,
        getAnswers,
      });
      break;
    }
    case "split-random": {
      nextNode = await processSplitRandom({
        currentNode,
        outgoers,
      });
      break;
    }
    case "split-points": {
      nextNode = await processSplitPoints({
        currentNode,
        outgoers,
        getPoints,
      });
      break;
    }
    case "split-result": {
      nextNode = await processSplitResult({
        currentNode,
        outgoers,
        getResults,
      });
      break;
    }
    default: {
      throw TypeError("node type not found");
    }
  }
  if (nextNode.type?.includes("split-") || nextNode.type === "portal-input") {
    return next({
      currentId: nextNode.id,
      nodes,
      edges,
      getAnswers,
      getResults,
      getPoints,
    });
  }
  return nextNode;
};

export const processPortalInput = async ({
  currentNode,
  nodes,
}: {
  currentNode: IFlowNode & { type: "portal-input" };
  nodes: IFlowNode[];
}): Promise<IFlowNode> => {
  const portalOutput = nodes.find(
    (n) =>
      n.type === "portal-output" && n.data.portal === currentNode.data.portal
  );
  if (portalOutput) {
    return portalOutput;
  }
  throw new TypeError("invalid portal node data");
};

export const processLinear = async ({
  outgoers,
}: {
  outgoers: IFlowNode[];
}): Promise<IFlowNode> => outgoers[0];

export const processSplitRandom = async ({
  currentNode,
  outgoers,
}: {
  currentNode: IFlowNode & { type: "split-random" };
  outgoers: IFlowNode[];
}): Promise<IFlowNode> => {
  const nextNode = outgoers[Math.floor(Math.random() * outgoers.length)];
  return nextNode;
};

export const processSplitPoints = async ({
  currentNode,
  outgoers,
  getPoints,
}: {
  currentNode: IFlowNode & { type: "split-points" };
  outgoers: IFlowNode[];
  getPoints: GetPoints;
}): Promise<IFlowNode> => {
  const data = currentNode.data;
  const points = await getPoints();

  if (outgoers.length > 1 && points > data.points) {
    return outgoers[1];
  }

  return outgoers[0];
};

export const processSplitAnswer = async ({
  currentNode,
  outgoers,
  getAnswers,
}: {
  currentNode: IFlowNode & { type: "split-answer" };
  outgoers: IFlowNode[];
  getAnswers: GetAnswers;
}): Promise<IFlowNode> => {
  const data = currentNode.data;
  let nodeIds: Set<string> = new Set([]);
  // collect nodeIds
  if (data.condition.type === "and" || data.condition.type === "or") {
    data.condition.conditions.forEach((c) => {
      nodeIds.add(c.nodeId);
    });
  } else {
    nodeIds.add(data.condition.nodeId);
  }

  const answers = await getAnswers(Array.from(nodeIds));
  const check = checkCondition(data.condition as ICondition, answers);

  if (check) {
    return outgoers[0];
  } else {
    return outgoers[1];
  }
};

export const processSplitResult = async ({
  currentNode,
  outgoers,
  getResults,
}: {
  currentNode: IFlowNode & { type: "split-result" };
  outgoers: IFlowNode[];
  getResults: GetResults;
}): Promise<IFlowNode> => {
  const data = currentNode.data;
  let nodeIds: Set<string> = new Set([]);
  // collect nodeIds
  if (data.condition.type === "and" || data.condition.type === "or") {
    data.condition.conditions.forEach((c) => {
      nodeIds.add(c.nodeId);
    });
  } else {
    nodeIds.add(data.condition.nodeId);
  }

  const results = await getResults(Array.from(nodeIds));
  const check = checkCondition(data.condition as ICondition, results);

  if (check) {
    return outgoers[0];
  } else {
    return outgoers[1];
  }
};

export const checkCondition = (
  condition: ICondition,
  objectMap: Record<string, any>
): boolean => {
  if (condition.type === "and") {
    let check = true;
    for (let c of condition.conditions) {
      check = check && checkPrimitiveCondition(c, objectMap);
      if (!check) {
        break;
      }
    }
    return check;
  } else if (condition.type === "or") {
    let check = false;
    for (let c of condition.conditions) {
      check = check || checkPrimitiveCondition(c, objectMap);
    }
    return check;
  } else {
    return checkPrimitiveCondition(condition, objectMap);
  }
};

export const checkPrimitiveCondition = (
  condition: IPrimitiveCondition,
  objectMap: Record<string, any>
): boolean => {
  let check = true;
  const nodeId = condition.nodeId;
  const value = _get(objectMap[nodeId], condition.key);

  switch (condition.type) {
    case "equal": {
      check = value == condition.value;
      break;
    }
    case "greater": {
      if (condition.include) {
        check = value >= condition.value;
      } else {
        check = value > condition.value;
      }
      break;
    }
    case "less": {
      if (condition.include) {
        check = value <= condition.value;
      } else {
        check = value < condition.value;
      }
      break;
    }
    case "in": {
      check = condition.value.includes(value);
      break;
    }
    case "true": {
      check = value == true;
      break;
    }
  }

  if (condition.not) {
    return !check;
  }

  return check;
};
