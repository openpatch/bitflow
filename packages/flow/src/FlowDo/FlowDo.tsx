import { TaskAnswer, TaskResult } from "@bitflow/base";
import { IShellAction, ITaskAction, Shell, ShellContent } from "@bitflow/shell";
import { Box, LoadingDots } from "@openpatch/patches";
import { FC, useEffect, useState } from "react";
import { FlowDoX, FlowProgress } from ".";
import { IFlowNode } from "../schemas";
import { FlowDoCheckpoint } from "./FlowDoCheckpoint";
import { FlowDoEnd } from "./FlowDoEnd";
import { FlowDoInput } from "./FlowDoInput";
import { FlowDoStart } from "./FlowDoStart";
import { FlowDoSynchronize } from "./FlowDoSynchronize";
import { FlowDoTask } from "./FlowDoTask";
import { FlowDoTitle } from "./FlowDoTitle";

export type FlowDoProps = {
  getCurrent: () => Promise<IFlowNode>;
  getNext: () => Promise<IFlowNode | null>;
  getPrevious?: () => Promise<IFlowNode | null>;
  onRetry: FlowDoX["onRetry"];
  getConfig: FlowDoX["getConfig"];
  getProgress: () => Promise<FlowProgress>;
  getResult: FlowDoX["getResult"];
  onEnd: () => void;
  onClose?: () => Promise<void>;
  onSkip: () => Promise<void>;
  onAction?: (action: IShellAction | ITaskAction) => void;
  evaluate?: (answer: TaskAnswer) => Promise<TaskResult>;
};

export const FlowDo: FC<FlowDoProps> = ({
  getCurrent,
  getNext,
  getPrevious,
  getConfig,
  onEnd,
  onRetry,
  onClose,
  onAction,
  onSkip,
  evaluate,
  getProgress,
  getResult,
}) => {
  const [currentNode, setCurrentNode] = useState<IFlowNode>();
  const [progress, setProgress] = useState<FlowProgress>({
    currentNodeIndex: 0,
    estimatedNodes: 1,
    nextNodeState: "unlocked",
  });

  useEffect(() => {
    getProgress()
      .then((p) => {
        if (p) {
          setProgress(p);
        }
      })
      .catch(() => {});
  }, [getProgress, currentNode]);

  useEffect(() => {
    getCurrent().then((n) => setCurrentNode(n));
  }, [getCurrent]);

  if (!currentNode) {
    return (
      <Shell>
        <ShellContent>
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="0"
            right="0"
            justifyContent="center"
            alignItems="center"
            display="flex"
          >
            <LoadingDots size="large" />
          </Box>
        </ShellContent>
      </Shell>
    );
  }

  const handleSkip = async () => {
    return onSkip().then(() => handleNext());
  };

  const handleNext = async () => {
    return getNext().then((n) => {
      if (n) {
        setCurrentNode(n);
      } else {
        onEnd();
      }
    });
  };

  const handlePrevious = async () => {
    if (getPrevious) {
      return getPrevious().then((n) => {
        if (n) {
          setCurrentNode(n);
        }
      });
    }
  };

  const handleClose = async () => {
    if (onClose) {
      return onClose();
    }
  };

  const handleRetry = async () => {
    if (onRetry) {
      return onRetry();
    }
  };

  if (currentNode.type === "task") {
    return (
      <FlowDoTask
        key={currentNode.id}
        node={currentNode}
        evaluate={evaluate}
        onSkip={handleSkip}
        onNext={handleNext}
        onRetry={handleRetry}
        onAction={onAction}
        onPrevious={getPrevious ? handlePrevious : undefined}
        onClose={onClose ? handleClose : undefined}
        getConfig={getConfig}
        progress={progress}
      />
    );
  } else if (currentNode.type === "input") {
    return (
      <FlowDoInput
        key={currentNode.id}
        node={currentNode}
        onNext={handleNext}
        progress={progress}
        onPrevious={getPrevious ? handlePrevious : undefined}
        onClose={onClose ? handleClose : undefined}
      />
    );
  } else if (currentNode.type === "title") {
    return (
      <FlowDoTitle
        key={currentNode.id}
        node={currentNode}
        progress={progress}
        onNext={handleNext}
        onPrevious={getPrevious ? handlePrevious : undefined}
        onClose={onClose ? handleClose : undefined}
      />
    );
  } else if (currentNode.type === "start") {
    return (
      <FlowDoStart
        key={currentNode.id}
        onNext={handleNext}
        node={currentNode}
      />
    );
  } else if (currentNode.type === "end") {
    return (
      <FlowDoEnd
        key={currentNode.id}
        getResult={getResult}
        node={currentNode}
      />
    );
  } else if (currentNode.type === "checkpoint") {
    return <FlowDoCheckpoint key={currentNode.id} onNext={handleNext} />;
  } else if (currentNode.type === "synchronize") {
    return (
      <FlowDoSynchronize
        key={currentNode.id}
        getProgress={getProgress}
        onNext={handleNext}
      />
    );
  }

  return <div />;
};
