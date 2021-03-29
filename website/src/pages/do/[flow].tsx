import { TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import {
  FlowDo,
  FlowDoProps,
  FlowProgress,
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
import atob from "atob";
import { GetServerSideProps } from "next";
import { useRef } from "react";

type DoProps = {
  flow: IFlow;
  startNode: IFlowNode;
  locale: Locale;
};

export default function Do({ flow, locale, startNode }: DoProps) {
  const currentNode = useRef<IFlowNode>(startNode);
  const progress = useRef<FlowProgress>({
    currentNode: 0,
    nextNode: "unlocked",
    estimatedNodes: flow.nodes.length,
    results: [],
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
    return progress.current.points;
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

    progress.current.currentNode += 1;
    return nextNode;
  };

  const getCurrent: FlowDoProps["getCurrent"] = async () => {
    return currentNode.current;
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

    progress.current.currentNode -= 1;
    return previousNode;
  };

  const getProgress: FlowDoProps["getProgress"] = async () => {
    return progress.current;
  };

  const onEnd: FlowDoProps["onEnd"] = () => {};

  const onSkip: FlowDoProps["onSkip"] = () => {};

  const evaluate: FlowDoProps["evaluate"] = async (answer) => {
    if (currentNode.current.type === "task") {
      const taskBit = taskBits[currentNode.current.data.subtype];

      const result: TaskResult = await taskBit.evaluate({
        answer,
        task: currentNode.current.data,
      });

      progress.current.results.push({
        ...result,
        nodeId: currentNode.current.id,
      });

      if (!submissions.current[currentNode.current.id]) {
        submissions.current[currentNode.current.id] = {
          answers: [answer],
          results: [result],
        };

        if (result.state === "correct") {
          progress.current.points += 1;
        }
      } else {
        const lastResult =
          submissions.current[currentNode.current.id].results[
            submissions.current[currentNode.current.id].results.length - 1
          ];
        submissions.current[currentNode.current.id].answers.push(answer);
        submissions.current[currentNode.current.id].results.push(result);

        if (lastResult.state === "correct" && result.state !== "correct") {
          progress.current.points -= 1;
        } else if (
          lastResult.state !== "correct" &&
          result.state === "correct"
        ) {
          progress.current.points += 1;
        }
      }

      return result;
    }

    return {
      state: "unknown",
    };
  };

  return (
    <BitflowProvider config={{}} locale={locale}>
      <PatternCenter>
        <Card>
          <Box position="relative" height="90vh" width="90vw">
            <FlowDo
              evaluate={evaluate}
              getConfig={getConfig}
              getCurrent={getCurrent}
              getNext={getNext}
              getPrevious={getPrevious}
              getProgress={getProgress}
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
  params,
  locale,
}) => {
  try {
    const flowJson = JSON.parse(atob(params?.flow as string));
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
    console.log(e);
    return {
      notFound: true,
    };
  }
};
