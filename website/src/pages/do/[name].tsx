import {
  DoResult,
  DoTry,
  findLast,
  Flow as IFlow,
  FlowStartNode,
  InteractiveFlowNode,
  isFlowStartNode,
  isFlowTaskNode,
  isInteractiveFlowNode,
} from "@bitflow/core";
import { Do, DoProgress, DoProps } from "@bitflow/do";
import {
  GetAnswers,
  GetPoints,
  GetResults,
  next,
  previous,
} from "@bitflow/flow-engine";
import { evaluate as taskChoice } from "@bitflow/task-choice";
import { evaluate as taskFillInTheBlank } from "@bitflow/task-fill-in-the-blank";
import { evaluate as taskInput } from "@bitflow/task-input";
import { Box, Card, PatternCenter } from "@openpatch/patches";
import { GetServerSideProps } from "next";
import { useRef } from "react";
import * as flows from "../../flows";

type DoPageProps = {
  flow: IFlow;
  startNode: FlowStartNode;
};

export default function DoPage({ flow, startNode }: DoPageProps) {
  const currentNode = useRef<InteractiveFlowNode>(startNode);
  const progress = useRef<DoProgress>({
    currentNodeIndex: 0,
    nextNodeState: "unlocked",
    estimatedNodes: flow.nodes.length,
  });
  const result = useRef<DoResult>({
    tries: [],
    endDate: new Date(),
    startDate: new Date(),
    maxPoints: 0,
    points: 0,
  });
  const submissions = useRef<
    Record<
      string,
      { answers: Bitflow.TaskAnswer[]; results: Bitflow.TaskResult[] }
    >
  >({});

  const getConfig: DoProps["getConfig"] = async () => {
    return {
      soundUrls: {
        correct: "/correct.mp3",
        wrong: "/wrong.mp3",
        unknown: "/unknown.mp3",
        manual: "/manual.mp3",
      },
    };
  };

  const getAnswers: GetAnswers = async (nodeIds) => {
    const answers: Record<string, Bitflow.TaskAnswer> = {};
    nodeIds.forEach((nid) => {
      if (
        nid in submissions.current &&
        submissions.current[nid].answers.length > 0
      ) {
        answers[nid] =
          submissions.current[nid].answers[
            submissions.current[nid].answers.length - 1
          ];
      }
    });

    return answers;
  };

  const getResults: GetResults = async (nodeIds) => {
    const results: Record<string, Bitflow.TaskResult> = {};
    nodeIds.forEach((nid) => {
      if (
        nid in submissions.current &&
        submissions.current[nid].results.length > 0
      ) {
        results[nid] =
          submissions.current[nid].results[
            submissions.current[nid].results.length - 1
          ];
      }
    });

    return results;
  };

  const getPoints: GetPoints = async () => {
    return result.current.points;
  };

  const getNext: DoProps["getNext"] = async () => {
    const nextNode = await next({
      currentId: currentNode.current.id,
      nodes: flow.nodes,
      edges: flow.edges,
      getAnswers,
      getPoints,
      getResults,
    });

    if (nextNode !== null && isInteractiveFlowNode(nextNode)) {
      currentNode.current = nextNode;

      progress.current.currentNodeIndex += 1;
      return { ...currentNode.current };
    }
    return null;
  };

  const getCurrent: DoProps["getCurrent"] = async () => {
    return { ...currentNode.current };
  };

  const getPrevious: DoProps["getPrevious"] = async () => {
    const previousNode = await previous({
      currentId: currentNode.current.id,
      nodes: flow.nodes,
      edges: flow.edges,
    });

    if (previousNode !== null && isInteractiveFlowNode(previousNode)) {
      currentNode.current = previousNode;

      progress.current.currentNodeIndex -= 1;
      return { ...currentNode.current };
    }

    return null;
  };

  const getProgress: DoProps["getProgress"] = async () => {
    return { ...progress.current };
  };

  const getResult: DoProps["getResult"] = async () => {
    return { ...result.current };
  };

  const onEnd: DoProps["onEnd"] = () => {};

  const onSkip: DoProps["onSkip"] = async () => {
    const currentPathEntry =
      result.current.tries[result.current.tries.length - 1];
    result.current.tries[result.current.tries.length - 1] = {
      ...currentPathEntry,
      status: "skipped",
      endDate: new Date(),
    };
  };

  const evaluate: DoProps["evaluate"] = async (answer: Bitflow.TaskAnswer) => {
    const taskBits = {
      choice: taskChoice,
      "fill-in-the-blank": taskFillInTheBlank,
      input: taskInput,
    } as const;

    const taskBit = taskBits[answer.subtype as keyof typeof taskBits];
    if (!taskBit || !isFlowTaskNode(currentNode.current)) {
      throw new Error("subtype not supported. See your provider config.");
    }

    const taskResult = await taskBit({
      answer,
      task: currentNode.current.data,
    } as any);

    const lastFinishedPathEntry = findLast<DoTry>(
      result.current.tries,
      (e) => e.status === "finished" && e.node.id === currentNode.current.id
    ) as DoTry & { status: "finished" };
    const currentPathEntry =
      result.current.tries[result.current.tries.length - 1];

    result.current.tries[result.current.tries.length - 1] = {
      ...currentPathEntry,
      status: "finished",
      endDate: new Date(),
      answer: answer as any,
      result: taskResult,
    };
    if (!lastFinishedPathEntry && taskResult.state === "correct") {
      result.current.points += 1;
    } else if (
      lastFinishedPathEntry &&
      lastFinishedPathEntry.result?.state === "correct" &&
      taskResult.state !== "correct"
    ) {
      result.current.points -= 1;
    } else if (
      lastFinishedPathEntry &&
      lastFinishedPathEntry.result?.state !== "correct" &&
      taskResult.state === "correct"
    ) {
      result.current.points += 1;
    }

    return taskResult;
  };

  const onRetry: DoProps["onRetry"] = async () => {
    const lastPath = result.current.tries[result.current.tries.length - 1];
    result.current.tries.push({
      status: "started",
      try: lastPath.try + 1,
      startDate: new Date(),
      node: {
        ...lastPath.node,
      },
    });
  };

  return (
    <PatternCenter>
      <Card>
        <Box position="relative" height="90vh" width="90vw">
          <Do
            onRetry={onRetry}
            evaluate={evaluate}
            getConfig={getConfig}
            getCurrent={getCurrent}
            getNext={getNext}
            getPrevious={getPrevious}
            getProgress={getProgress}
            getResult={getResult}
            onEnd={onEnd}
            onSkip={onSkip}
          />
        </Box>
      </Card>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps<
  DoPageProps,
  {
    name: string;
  }
> = async ({ params }) => {
  const name = params?.name as keyof typeof flows;
  try {
    const flow = flows[name];
    const startNode = flow.nodes.find(isFlowStartNode);

    if (!startNode) {
      throw new Error("no start node");
    }

    return {
      props: {
        flow,
        startNode,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
};
