import { Action, DoResult, InteractiveFlowNode } from "@bitflow/core";
import { IShellAction, ITaskAction, TaskShellProps } from "@bitflow/shell";

export type DoConfig = {
  enableConfidence?: boolean;
  enableReasoning?: boolean;
  soundUrls?: TaskShellProps<any, any, any, any>["soundUrls"];
};

export type DoProgress = {
  progress: number;
  next: "locked" | "unlocked";
};

export type DoPropsBase = {
  onNext: () => Promise<void>;
  evaluate?: (answer: Bitflow.TaskAnswer) => Promise<Bitflow.TaskResult>;
  onSkip: () => Promise<void>;
  onClose?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
  onRetry: () => Promise<void>;
  onAction?: (
    action:
      | ITaskAction<Action>
      | IShellAction<Bitflow.TaskAnswer, Bitflow.TaskResult>
  ) => void;
  getConfig: () => Promise<DoConfig>;
  progress: DoProgress;
  getProgress: () => Promise<DoProgress>;
  getResult: () => Promise<DoResult>;
  node: InteractiveFlowNode;
};
