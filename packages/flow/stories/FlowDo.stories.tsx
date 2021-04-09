import { TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { proceduralC as flow } from "../../../website/src/flows/proceduralC";
import {
  GetAnswers,
  GetPoints,
  GetResults,
  next,
  previous,
} from "../src/engine";
import {
  FlowConfig,
  FlowDo,
  FlowDoProps,
  FlowProgress,
  FlowResult,
  FlowResultPathEntry,
} from "../src/FlowDo";
import { extractPublicNode, IFlowNode } from "../src/schemas";

export default {
  title: "Flow/FlowDo",
  component: FlowDo,
} as Meta;

const config: FlowConfig = {
  soundUrls: {
    correct: "/correct.mp3",
    wrong: "/wrong.mp3",
    unknown: "/unknown.mp3",
    manual: "/manual.mp3",
  },
};

const progress: FlowProgress = {
  currentNodeIndex: 0,
  nextNodeState: "unlocked",
  estimatedNodes: flow.nodes.length - 1,
};

let points = 0;

const path: FlowResult["path"] = [];

function findLast<T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean
): T | null {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return array[l];
  }
  return null;
}

let currentNode: IFlowNode = flow.nodes.find(
  (n) => n.type === "start"
) as IFlowNode;

const onEnd: FlowDoProps["onEnd"] = async () => {
  console.log("end");
};

const onSkip: FlowDoProps["onSkip"] = async () => {
  const currentPathEntry = path[path.length - 1];
  path[path.length - 1] = {
    ...currentPathEntry,
    status: "skipped",
    endDate: new Date(),
  };
};

const evaluate: FlowDoProps["evaluate"] = async (answer) => {
  if (currentNode.type === "task") {
    const taskBit = taskBits[currentNode.data.subtype];

    const result = (await taskBit.evaluate({
      answer,
      task: currentNode.data,
    })) as TaskResult;

    const lastFinishedPathEntry = findLast<FlowResultPathEntry>(
      path,
      (e) => e.status === "finished" && e.node.id === currentNode.id
    ) as FlowResultPathEntry & { status: "finished" };
    const currentPathEntry = path[path.length - 1];

    path[path.length - 1] = {
      ...currentPathEntry,
      status: "finished",
      endDate: new Date(),
      answer,
      result,
    };
    if (!lastFinishedPathEntry && result.state === "correct") {
      points += 1;
    } else if (
      lastFinishedPathEntry &&
      lastFinishedPathEntry.result.state === "correct" &&
      result.state !== "correct"
    ) {
      points -= 1;
    } else if (
      lastFinishedPathEntry &&
      lastFinishedPathEntry.result.state !== "correct" &&
      result.state === "correct"
    ) {
      points += 1;
    }

    return result;
  }

  return {
    state: "unknown",
  };
};

const getConfig: FlowDoProps["getConfig"] = async () => {
  if (currentNode.id === "80eaa994-c767-4d3e-8fe0-16e2754be8c7") {
    return {
      ...config,
      enableConfidence: true,
    };
  }
  return config;
};

const getCurrent: FlowDoProps["getCurrent"] = async () => {
  return currentNode;
};

const getAnswers: GetAnswers = async (nodeIds) => {
  const answers: Record<string, TaskAnswer> = {};

  path.forEach((e) => {
    if (nodeIds.includes(e.node.id) && e.status === "finished") {
      answers[e.node.id] = e.answer;
    }
  });

  return answers;
};

const getResults: GetResults = async (nodeIds) => {
  const results: Record<string, TaskResult> = {};

  path.forEach((e) => {
    if (nodeIds.includes(e.node.id) && e.status === "finished") {
      results[e.node.id] = e.result;
    }
  });

  return results;
};

const getPoints: GetPoints = async () => {
  return points;
};

const getProgress: FlowDoProps["getProgress"] = async () => {
  return progress;
};

const getNext: FlowDoProps["getNext"] = async () => {
  const nextNode = await next({
    currentId: currentNode.id,
    nodes: flow.nodes,
    edges: flow.edges,
    getAnswers,
    getResults,
    getPoints,
  });

  if (
    nextNode !== null &&
    (nextNode.type === "task" ||
      nextNode.type === "input" ||
      nextNode.type === "title" ||
      nextNode.type === "checkpoint" ||
      nextNode.type === "synchronize")
  ) {
    currentNode = nextNode;

    path.push({
      status: "started",
      try: 0,
      startDate: new Date(),
      node: extractPublicNode(nextNode),
    });
  }

  if (nextNode?.type === "synchronize") {
    progress.nextNodeState = "locked";
  }

  console.log(path);
  progress.currentNodeIndex += 1;

  return nextNode;
};

const getResult: FlowDoProps["getResult"] = async () => {
  return {
    path,
    points,
  };
};

const getPrevious: FlowDoProps["getPrevious"] = async () => {
  const prevNode = await previous({
    currentId: currentNode.id,
    nodes: flow.nodes,
    edges: flow.edges,
  });

  if (prevNode !== null) {
    currentNode = prevNode;
  }

  path.push({
    status: "started",
    node: extractPublicNode(prevNode as any),
    startDate: new Date(),
    try: 0,
  });

  progress.currentNodeIndex -= 1;

  return prevNode;
};

const onRetry: FlowDoProps["onRetry"] = async () => {
  const lastPath = path[path.length - 1];
  path.push({
    status: "started",
    try: lastPath.try + 1,
    startDate: new Date(),
    node: {
      ...lastPath.node,
    },
  });
};

export const Default = () => {
  return (
    <Box position="absolute" height="100vh" width="100vw">
      <FlowDo
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
    </Box>
  );
};
