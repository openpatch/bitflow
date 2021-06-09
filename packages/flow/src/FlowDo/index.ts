import { Action, Evaluate, TaskAnswer, TaskResult } from "@bitflow/base";
import { TaskShellProps } from "@bitflow/shell";
import { IFlowNode, IFlowNodePublic } from "../schemas";

export type FlowDoConfig = {
  enableConfidence?: boolean;
  enableReasoning?: boolean;
  soundUrls?: TaskShellProps<any, any, any, any>["soundUrls"];
};

export type FlowDoProgress = {
  estimatedNodes: number;
  currentNodeIndex: number;
  nextNodeState: "locked" | "unlocked";
};

export type FlowDoResultPathEntry = {
  status: string;
  node: IFlowNodePublic;
  startDate: Date | string;
  try: number;
} & (
  | {
      status: "started";
    }
  | {
      status: "finished";
      endDate: Date | string;
      answer: TaskAnswer;
      result: TaskResult & Record<string, any>;
    }
  | {
      status: "skipped";
      endDate: Date | string;
    }
);

export type FlowDoResult = {
  points: number;
  maxPoints: number;
  path: FlowDoResultPathEntry[];
  startDate: Date | string;
  endDate?: Date | string;
};

export type FlowDoX = {
  onNext: () => Promise<void>;
  evaluate?: Evaluate<any, any, any>;
  onSkip: () => Promise<void>;
  onClose?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
  onRetry: () => Promise<void>;
  onAction?: (action: Action) => void;
  getConfig: () => Promise<FlowDoConfig>;
  progress: FlowDoProgress;
  getResult: () => Promise<FlowDoResult>;
  node: IFlowNode;
};

export * from "./FlowDo";
