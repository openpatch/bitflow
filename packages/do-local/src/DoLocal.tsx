import {
  DoResult,
  extractInteractiveFlowPublicNode,
  finishDoTry,
  Flow,
  InteractiveFlowNode,
  isFlowStartNode,
  isInteractiveFlowNode,
  retryDoTry,
  skipDoTry,
} from "@bitflow/core";
import { Do, DoConfig, DoProgress, DoProps } from "@bitflow/do";
import {
  calculateProgress,
  collectAnswers,
  collectResults,
  next,
  previous,
} from "@bitflow/flow-engine";
import { useFlow } from "@bitflow/provider";
import { useRef } from "react";

export type DoLocalProps = {
  flow: Flow & { language: string };
  config?: DoConfig;
};

export const DoLocal = ({ flow, config: configOverwrite }: DoLocalProps) => {
  const { evaluate: flowEvaluate } = useFlow();
  const config = useRef<DoConfig>({
    soundUrls: {
      correct: "/correct.mp3",
      wrong: "/wrong.mp3",
      unknown: "/unknown.mp3",
      manual: "/manual.mp3",
    },
    ...configOverwrite,
  });
  const currentNode = useRef<InteractiveFlowNode>(
    flow.nodes.find(isFlowStartNode) as InteractiveFlowNode
  );
  const progress = useRef<DoProgress>({
    progress: 0,
    next: "unlocked",
  });
  const result = useRef<DoResult>({
    points: 0,
    maxPoints: 0,
    tries: [],
    endDate: new Date(),
    startDate: new Date(),
  });

  const getProgress: DoProps["getProgress"] = async () => {
    progress.current.progress = await calculateProgress({
      nodes: flow.nodes,
      edges: flow.edges,
      currentId: currentNode.current.id,
    });
    return progress.current;
  };

  const getResult: DoProps["getResult"] = async () => {
    return result.current;
  };
  const getConfig: DoProps["getConfig"] = async () => {
    return config.current;
  };

  const getCurrent: DoProps["getCurrent"] = async () => {
    if (!currentNode.current) {
      throw new Error("no current node");
    }
    return currentNode.current;
  };

  const getNext: DoProps["getNext"] = async () => {
    const { tries, points } = result.current;
    if (currentNode) {
      const nextNode = await next({
        currentId: currentNode.current.id,
        nodes: flow.nodes,
        edges: flow.edges,
        getAnswers: async (nodeIds) => collectAnswers(tries, nodeIds),
        getResults: async (nodeIds) => collectResults(tries, nodeIds),
        getPoints: async () => points,
      });

      if (nextNode && isInteractiveFlowNode(nextNode)) {
        currentNode.current = nextNode;
        const lastTry = Math.max(
          ...tries.filter((t) => t.node.id == nextNode.id).map((t) => t.try),
          -1
        );
        tries.push({
          status: "started",
          try: lastTry + 1,
          startDate: new Date(),
          node: extractInteractiveFlowPublicNode(nextNode),
        });

        if (nextNode.type === "synchronize") {
          progress.current.next = "locked";
          // simulate a synchronize node with a 1sec timeout
          setTimeout(() => (progress.current.next = "unlocked"), 1000);
        }

        return nextNode;
      }
    }
    return null;
  };

  const getPrevious: DoProps["getPrevious"] = async () => {
    const { tries } = result.current;
    if (currentNode.current) {
      const prevNode = await previous({
        currentId: currentNode.current.id,
        nodes: flow.nodes,
        edges: flow.edges,
      });

      if (prevNode && isInteractiveFlowNode(prevNode)) {
        currentNode.current = prevNode;
        const lastTry = Math.max(
          ...tries.filter((t) => t.node.id == prevNode.id).map((t) => t.try),
          -1
        );
        tries.push({
          status: "started",
          node: extractInteractiveFlowPublicNode(prevNode),
          startDate: new Date(),
          try: lastTry + 1,
        });

        return prevNode;
      }
    }
    return null;
  };

  const evaluate: DoProps["evaluate"] = async (answer) => {
    if (currentNode.current?.type !== "task") {
      throw new Error("type not supported");
    }
    // evaluate the answer
    let taskResult = await flowEvaluate({
      answer,
      task: currentNode.current.data,
    });
    result.current = finishDoTry(result.current, answer, taskResult);

    return taskResult;
  };

  const onRetry: DoProps["onRetry"] = async () => {
    result.current = retryDoTry(result.current);
  };

  const onEnd: DoProps["onEnd"] = async () => {
    console.log("The End!");
  };
  const onSkip: DoProps["onSkip"] = async () => {
    result.current = skipDoTry(result.current, {
      mode: (currentNode.current as any).data?.evaluation?.mode,
    });
  };

  return (
    <Do
      onEnd={onEnd}
      onSkip={onSkip}
      onRetry={onRetry}
      evaluate={evaluate}
      getConfig={getConfig}
      getCurrent={getCurrent}
      getNext={getNext}
      getPrevious={getPrevious}
      getProgress={getProgress}
      getResult={getResult}
    />
  );
};
