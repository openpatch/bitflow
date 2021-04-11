import { findLast, TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import {
  FlowDo,
  FlowDoProps,
  FlowProgress,
  FlowResult,
  FlowResultPathEntry,
  FlowSchema,
  GetAnswers,
  GetPoints,
  GetResults,
  IFlow,
  IFlowNode,
  next,
  previous,
} from "@bitflow/flow";
import { BitflowProvider, Locale } from "@bitflow/provider";
import { Box, Card, PatternCenter } from "@openpatch/patches";
import { GetServerSideProps } from "next";
import { useRef } from "react";
import { convertFromStringToJson } from "../../utils/convertFlow";

type DoProps = {
  flow: IFlow;
  startNode: IFlowNode;
  locale: Locale;
};

export default function Do({ flow, locale, startNode }: DoProps) {
  const currentNode = useRef<IFlowNode>(startNode);
  const progress = useRef<FlowProgress>({
    currentNodeIndex: 0,
    nextNodeState: "unlocked",
    estimatedNodes: flow.nodes.length,
  });
  const result = useRef<FlowResult>({
    path: [],
    maxPoints: 0,
    points: 0,
  });
  const submissions = useRef<
    Record<string, { answers: TaskAnswer[]; results: TaskResult[] }>
  >({});

  const getConfig: FlowDoProps["getConfig"] = async () => {
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
    const answers: Record<string, TaskAnswer> = {};
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
    const results: Record<string, TaskResult> = {};
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

  const getNext: FlowDoProps["getNext"] = async () => {
    const nextNode = await next({
      currentId: currentNode.current.id,
      nodes: flow.nodes,
      edges: flow.edges,
      getAnswers,
      getPoints,
      getResults,
    });

    if (nextNode !== null) {
      currentNode.current = nextNode;
    }

    progress.current.currentNodeIndex += 1;
    return { ...currentNode.current };
  };

  const getCurrent: FlowDoProps["getCurrent"] = async () => {
    return { ...currentNode.current };
  };

  const getPrevious: FlowDoProps["getPrevious"] = async () => {
    const previousNode = await previous({
      currentId: currentNode.current.id,
      nodes: flow.nodes,
      edges: flow.edges,
    });

    if (previousNode !== null) {
      currentNode.current = previousNode;
    }

    progress.current.currentNodeIndex -= 1;
    return { ...currentNode.current };
  };

  const getProgress: FlowDoProps["getProgress"] = async () => {
    return { ...progress.current };
  };

  const getResult: FlowDoProps["getResult"] = async () => {
    return { ...result.current };
  };

  const onEnd: FlowDoProps["onEnd"] = () => {};

  const onSkip: FlowDoProps["onSkip"] = async () => {
    const currentPathEntry =
      result.current.path[result.current.path.length - 1];
    result.current.path[result.current.path.length - 1] = {
      ...currentPathEntry,
      status: "skipped",
      endDate: new Date(),
    };
  };

  const evaluate: FlowDoProps["evaluate"] = async (answer) => {
    if (currentNode.current.type === "task") {
      const taskBit = taskBits[currentNode.current.data.subtype];

      const taskResult = (await taskBit.evaluate({
        answer,
        task: currentNode.current.data,
      })) as TaskResult;

      const lastFinishedPathEntry = findLast<FlowResultPathEntry>(
        result.current.path,
        (e) => e.status === "finished" && e.node.id === currentNode.current.id
      ) as FlowResultPathEntry & { status: "finished" };
      const currentPathEntry =
        result.current.path[result.current.path.length - 1];

      result.current.path[result.current.path.length - 1] = {
        ...currentPathEntry,
        status: "finished",
        endDate: new Date(),
        answer,
        result: taskResult,
      };
      if (!lastFinishedPathEntry && taskResult.state === "correct") {
        result.current.points += 1;
      } else if (
        lastFinishedPathEntry &&
        lastFinishedPathEntry.result.state === "correct" &&
        taskResult.state !== "correct"
      ) {
        result.current.points -= 1;
      } else if (
        lastFinishedPathEntry &&
        lastFinishedPathEntry.result.state !== "correct" &&
        taskResult.state === "correct"
      ) {
        result.current.points += 1;
      }

      return taskResult;
    }

    return {
      state: "unknown",
    };
  };
  const onRetry: FlowDoProps["onRetry"] = async () => {
    const lastPath = result.current.path[result.current.path.length - 1];
    result.current.path.push({
      status: "started",
      try: lastPath.try + 1,
      startDate: new Date(),
      node: {
        ...lastPath.node,
      },
    });
  };

  return (
    <BitflowProvider config={{}} locale={locale}>
      <PatternCenter>
        <Card>
          <Box position="relative" height="90vh" width="90vw">
            <FlowDo
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
    </BitflowProvider>
  );
}

export const getServerSideProps: GetServerSideProps<DoProps> = async ({
  query,
  locale,
}) => {
  try {
    const flowJson = convertFromStringToJson(query?.flow as string);
    const flow = FlowSchema.parse(flowJson);

    let usedLocale: Locale = "en";
    if (locale === "de") {
      usedLocale = "de";
    }

    const startNode = flow.nodes.find((n) => n.type === "start");

    if (!startNode) {
      throw new Error("no start node");
    }

    return {
      props: {
        flow,
        locale: usedLocale,
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
