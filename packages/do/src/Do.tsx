import { InteractiveFlowNode } from "@bitflow/core";
import { IShellAction, ITaskAction, Shell, ShellContent } from "@bitflow/shell";
import { Box, LoadingDots } from "@openpatch/patches";
import { FC, useEffect, useState } from "react";
import { DoCheckpoint } from "./DoCheckpoint";
import { DoEnd } from "./DoEnd";
import { DoInput } from "./DoInput";
import { DoStart } from "./DoStart";
import { DoSynchronize } from "./DoSynchronize";
import { DoTask } from "./DoTask";
import { DoTitle } from "./DoTitle";
import { DoProgress, DoPropsBase } from "./types";

export type DoProps = {
  getCurrent: () => Promise<InteractiveFlowNode>;
  getNext: () => Promise<InteractiveFlowNode | null>;
  getPrevious?: () => Promise<InteractiveFlowNode | null>;
  onRetry: DoPropsBase["onRetry"];
  getConfig: DoPropsBase["getConfig"];
  getProgress: () => Promise<DoProgress>;
  getResult: DoPropsBase["getResult"];
  onEnd: () => void;
  onClose?: () => Promise<void>;
  onSkip: () => Promise<void>;
  onAction?: (
    action: IShellAction<Bitflow.TaskAnswer, Bitflow.TaskResult> | ITaskAction
  ) => void;
  evaluate?: (answer: Bitflow.TaskAnswer) => Promise<Bitflow.TaskResult>;
};

export const Do: FC<DoProps> = ({
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
  const [currentNode, setCurrentNode] = useState<InteractiveFlowNode>();
  const [progress, setProgress] = useState<DoProgress>({
    progress: 0,
    next: "unlocked",
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
      <DoTask
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
      <DoInput
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
      <DoTitle
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
      <DoStart key={currentNode.id} onNext={handleNext} node={currentNode} />
    );
  } else if (currentNode.type === "end") {
    return (
      <DoEnd
        key={currentNode.id}
        getResult={getResult}
        onNext={handleNext}
        node={currentNode}
      />
    );
  } else if (currentNode.type === "checkpoint") {
    return <DoCheckpoint key={currentNode.id} onNext={handleNext} />;
  } else if (currentNode.type === "synchronize") {
    return (
      <DoSynchronize
        key={currentNode.id}
        getProgress={getProgress}
        onNext={handleNext}
      />
    );
  }

  return <div />;
};
