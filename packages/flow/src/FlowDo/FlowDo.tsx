import { TaskAnswer, TaskResult } from "@bitflow/base";
import { IShellAction, ITaskAction, Shell, ShellContent } from "@bitflow/shell";
import { FC, useEffect, useState } from "react";
import { FlowDoX } from ".";
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
  getPrevious: () => Promise<IFlowNode | null>;
  getConfig: FlowDoX["getConfig"];
  getProgress: FlowDoX["getProgress"];
  onEnd: () => void;
  onClose?: () => void;
  onSkip: () => void;
  onAction?: (action: IShellAction | ITaskAction) => void;
  evaluate?: (answer: TaskAnswer) => Promise<TaskResult>;
};

export const FlowDo: FC<FlowDoProps> = ({
  getCurrent,
  getNext,
  getPrevious,
  getConfig,
  onEnd,
  onClose,
  onAction,
  onSkip,
  evaluate,
  getProgress,
}) => {
  const [currentNode, setCurrentNode] = useState<IFlowNode>();

  useEffect(() => {
    getCurrent().then((n) => setCurrentNode(n));
  }, [getCurrent]);

  if (!currentNode) {
    return (
      <Shell>
        <ShellContent>Loading</ShellContent>
      </Shell>
    );
  }

  const handleSkip = () => {
    onSkip();
    handleNext();
  };

  const handleNext = () => {
    getNext().then((n) => {
      if (n) {
        setCurrentNode(n);
      } else {
        onEnd();
      }
    });
  };

  const handlePrevious = () => {
    getPrevious().then((n) => {
      if (n) {
        setCurrentNode(n);
      }
    });
  };

  if (currentNode.type === "task") {
    return (
      <FlowDoTask
        key={currentNode.id}
        node={currentNode}
        evaluate={evaluate}
        onSkip={handleSkip}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAction={onAction}
        onClose={onClose}
        getConfig={getConfig}
      />
    );
  } else if (currentNode.type === "input") {
    return (
      <FlowDoInput
        key={currentNode.id}
        node={currentNode}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={onClose}
      />
    );
  } else if (currentNode.type === "title") {
    return (
      <FlowDoTitle
        key={currentNode.id}
        node={currentNode}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={onClose}
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
        getProgress={getProgress}
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
