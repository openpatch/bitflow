type NodeBase = {
  id: string;
  position: { x: number; y: number };
};

// INTERACTIVE FLOW NODES
export type FlowCheckpointNode = NodeBase & {
  type: "checkpoint";
};

export type FlowCheckpointPublicNode = Pick<FlowCheckpointNode, "id" | "type">;

export type FlowSynchronizeNode = NodeBase & {
  type: "synchronize";
};

export type FlowSynchronizePublicNode = Pick<
  FlowSynchronizeNode,
  "id" | "type"
>;

export type FlowTaskNode = NodeBase & {
  type: "task";
  data: Bitflow.Task;
};

export type FlowTaskPublicNode = {
  type: "task";
  id: string;
  data: Pick<Bitflow.Task, "view" | "subtype" | "name">;
};

export const isFlowTaskNode = (n: FlowNode): n is FlowTaskNode => {
  if (n.type === "task") {
    return true;
  }
  return false;
};

export type FlowStartNode = NodeBase & {
  type: "start";
  data: Bitflow.Start;
};

export type FlowStartPublicNode = Pick<FlowStartNode, "type" | "data" | "id">;

export const isFlowStartNode = (n: FlowNode): n is FlowStartNode => {
  if (n.type === "start") {
    return true;
  }
  return false;
};

export type FlowEndNode = NodeBase & {
  type: "end";
  data: Bitflow.End;
};

export const isFlowEndNode = (n: FlowNode): n is FlowEndNode => {
  if (n.type === "end") {
    return true;
  }
  return false;
};

export type FlowEndPublicNode = Pick<FlowEndNode, "type" | "data" | "id">;

export type FlowInputNode = NodeBase & {
  type: "input";
  data: Bitflow.Input;
};

export const isFlowInputNode = (n: FlowNode): n is FlowInputNode => {
  if (n.type === "input") {
    return true;
  }
  return false;
};

export type FlowInputPublicNode = Pick<FlowInputNode, "type" | "data" | "id">;

export type FlowTitleNode = NodeBase & {
  type: "title";
  data: Bitflow.Title;
};

export const isFlowTitleNode = (n: FlowNode): n is FlowTitleNode => {
  if (n.type === "title") {
    return true;
  }
  return false;
};

export type FlowTitlePublicNode = Pick<FlowTitleNode, "type" | "data" | "id">;

export type InteractiveFlowNode =
  | FlowTaskNode
  | FlowStartNode
  | FlowEndNode
  | FlowInputNode
  | FlowTitleNode
  | FlowCheckpointNode
  | FlowSynchronizeNode;

export type InteractiveFlowPublicNode =
  | FlowTaskPublicNode
  | FlowStartPublicNode
  | FlowEndPublicNode
  | FlowInputPublicNode
  | FlowTitlePublicNode
  | FlowCheckpointPublicNode
  | FlowSynchronizePublicNode;

// CONTROL FLOW NODES
export type EqualCondition = {
  type: "equal";
  not: boolean;
  nodeId: string;
  key: string;
  value: string | number;
};

export type TrueCondition = {
  type: "true";
  not: boolean;
  nodeId: string;
  key: string;
};

export type GreaterCondition = {
  type: "greater";
  include: boolean;
  not: boolean;
  nodeId: string;
  key: string;
  value: number;
};

export type LessCondition = {
  type: "less";
  include: boolean;
  not: boolean;
  nodeId: string;
  key: string;
  value: number;
};

export type InCondition = {
  type: "in";
  not: boolean;
  nodeId: string;
  key: string;
  value: (string | number)[];
};

export type PrimitiveCondition =
  | EqualCondition
  | TrueCondition
  | GreaterCondition
  | LessCondition
  | InCondition;

export type AndCondition = {
  type: "and";
  conditions: PrimitiveCondition[];
};

export type OrCondition = {
  type: "or";
  conditions: PrimitiveCondition[];
};

export type Condition = PrimitiveCondition | AndCondition | OrCondition;

export type SplitAnswer = {
  condition: Condition;
};

export type FlowSplitAnswerNode = NodeBase & {
  type: "split-answer";
  data: SplitAnswer;
};

export type SplitResult = {
  condition: Condition;
};

export type FlowSplitResultNode = NodeBase & {
  type: "split-result";
  data: SplitResult;
};

export type SplitPoints = {
  points: number;
};

export type FlowSplitPointsNode = NodeBase & {
  type: "split-points";
  data: SplitPoints;
};

export type PortalInput = {
  portal: string;
  description: string;
};

export type PortalOutput = {
  portal: string;
  description: string;
};

export type FlowPortalInputNode = NodeBase & {
  type: "portal-input";
  data: PortalInput;
};

export type FlowPortalOutputNode = NodeBase & {
  type: "portal-output";
  data: PortalOutput;
};

export type FlowSplitRandomNode = NodeBase & {
  type: "split-random";
};

export type ControlFlowNode =
  | FlowSplitAnswerNode
  | FlowSplitResultNode
  | FlowSplitPointsNode
  | FlowSplitRandomNode
  | FlowPortalInputNode
  | FlowPortalOutputNode;

export type FlowNode = InteractiveFlowNode | ControlFlowNode;

export const isInteractiveFlowNode = (
  n: FlowNode
): n is InteractiveFlowNode => {
  if (
    n.type === "checkpoint" ||
    n.type === "end" ||
    n.type === "input" ||
    n.type === "start" ||
    n.type === "synchronize" ||
    n.type === "task" ||
    n.type === "title"
  ) {
    return true;
  }

  return false;
};

export type FlowEdge = {
  id: string;
  source: string;
  sourceHandle?: "a" | "b" | "c" | "d" | "e" | "f";
  target: string;
};

export type Flow = {
  name: string;
  description: string;
  language: "en" | "de" | "fr" | "es" | "nl" | "pt" | "tr" | "it";
  visibility: "public" | "private" | "unlisted";
  draft: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  zoom?: number;
  position?: [number, number];
};

export const extractInteractiveFlowPublicNode = (
  n: InteractiveFlowNode
): InteractiveFlowPublicNode => {
  if (n.type === "task") {
    return {
      id: n.id,
      type: n.type,
      data: {
        name: n.data.name,
        subtype: n.data.subtype,
        view: n.data.view,
      },
    };
  } else if (n.type === "synchronize" || n.type === "checkpoint") {
    return {
      id: n.id,
      type: n.type,
    };
  } else if (n.type === "input") {
    return {
      id: n.id,
      type: n.type,
      data: n.data,
    };
  } else if (n.type === "end") {
    return {
      id: n.id,
      type: n.type,
      data: n.data,
    };
  } else if (n.type === "start") {
    return {
      id: n.id,
      type: n.type,
      data: n.data,
    };
  }
  return {
    id: n.id,
    type: n.type,
    data: n.data,
  };
};
