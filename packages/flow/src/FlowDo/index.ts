import { Action, Evaluate, TaskResult } from "@bitflow/base";
import { TaskShellProps } from "@bitflow/shell";
import { IFlowNode } from "../schemas";

export type FlowConfig = {
  enableConfidence?: boolean;
  enableReasoning?: boolean;
  soundUrls?: TaskShellProps<any, any, any, any>["soundUrls"];
};

export type FlowProgress = {
  estimatedNodes: number;
  currentNode: number;
  nextNode: "locked" | "unlocked";
  results: (TaskResult & { nodeId: string })[];
  points: number;
};

export type FlowDoX = {
  onNext: () => void;
  evaluate?: Evaluate<any, any, any>;
  onSkip: () => void;
  onClose?: () => void;
  onPrevious?: () => void;
  onAction?: (action: Action) => void;
  getConfig: () => Promise<FlowConfig>;
  getProgress: () => Promise<FlowProgress>;
  node: IFlowNode;
};

export * from "./FlowDo";
