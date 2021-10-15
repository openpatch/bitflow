import {
  DoResult,
  DoTry,
  extractInteractiveFlowPublicNode,
  InteractiveFlowNode,
  isFlowStartNode,
  isInteractiveFlowNode,
} from "@bitflow/core";
import {
  GetAnswers,
  GetPoints,
  GetResults,
  next,
  previous,
} from "@bitflow/flow-engine";
import { evaluate as choiceEvaluate } from "@bitflow/task-choice";
import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { proceduralC as flow } from "../../../website/src/flows/proceduralC";
import { Do, DoProps } from "../src/Do";
import { DoConfig, DoProgress } from "../src/types";

export default {
  title: "Do/Do",
  component: Do,
} as Meta;

const config: DoConfig = {
  soundUrls: {
    correct: "/correct.mp3",
    wrong: "/wrong.mp3",
    unknown: "/unknown.mp3",
    manual: "/manual.mp3",
  },
};

const progress: DoProgress = {
  next: "unlocked",
  progress: 0,
};

let points = 0;

const tries: DoResult["tries"] = [];

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

let currentNode = flow.nodes.find(isFlowStartNode) as InteractiveFlowNode;

const onEnd: DoProps["onEnd"] = async () => {
  console.log("end");
};

const onSkip: DoProps["onSkip"] = async () => {
  const currentPathEntry = tries[tries.length - 1];
  tries[tries.length - 1] = {
    ...currentPathEntry,
    status: "skipped",
    endDate: new Date(),
    evaluation: {
      mode: "auto",
    },
  };
};

const evaluate: DoProps["evaluate"] = async (answer) => {
  if (currentNode.type !== "task") {
    throw new Error("evaluate works only for tasks");
  }

  if (currentNode.data.subtype === "choice" && answer.subtype !== "choice") {
    throw new Error("evaluate work only for choice");
  }
  const result = await choiceEvaluate({
    answer: answer as any,
    task: currentNode.data as any,
  });

  const lastFinishedNodeTry = findLast<DoTry>(
    tries,
    (e) => e.status === "finished" && e.node.id === currentNode.id
  ) as DoTry & { status: "finished" };
  const currentPathEntry = tries[tries.length - 1];

  tries[tries.length - 1] = {
    ...currentPathEntry,
    status: "finished",
    endDate: new Date(),
    answer: answer as any,
    result,
  };
  if (!lastFinishedNodeTry && result.state === "correct") {
    points += 1;
  } else if (
    lastFinishedNodeTry &&
    lastFinishedNodeTry.node.type === "task" &&
    lastFinishedNodeTry.result?.state === "correct" &&
    result.state !== "correct"
  ) {
    points -= 1;
  } else if (
    lastFinishedNodeTry &&
    lastFinishedNodeTry.result?.state !== "correct" &&
    result.state === "correct"
  ) {
    points += 1;
  }

  return result;
};

const getConfig: DoProps["getConfig"] = async () => {
  if (currentNode.id === "80eaa994-c767-4d3e-8fe0-16e2754be8c7") {
    return {
      ...config,
      enableConfidence: true,
    };
  }
  return config;
};

const getCurrent: DoProps["getCurrent"] = async () => {
  return currentNode;
};

const getAnswers: GetAnswers = async (nodeIds) => {
  const answers: Record<string, Bitflow.TaskAnswer> = {};

  tries.forEach((e) => {
    if (nodeIds.includes(e.node.id) && e.status === "finished" && e.answer) {
      answers[e.node.id] = e.answer;
    }
  });

  return answers;
};

const getResults: GetResults = async (nodeIds) => {
  const results: Record<string, Bitflow.TaskResult> = {};

  tries.forEach((e) => {
    if (nodeIds.includes(e.node.id) && e.status === "finished" && e.result) {
      results[e.node.id] = e.result;
    }
  });

  return results;
};

const getPoints: GetPoints = async () => {
  return points;
};

const getProgress: DoProps["getProgress"] = async () => {
  return progress;
};

const getNext: DoProps["getNext"] = async () => {
  const nextNode = await next({
    currentId: currentNode.id,
    nodes: flow.nodes,
    edges: flow.edges,
    getAnswers,
    getResults,
    getPoints,
  });

  if (nextNode !== null && isInteractiveFlowNode(nextNode)) {
    currentNode = nextNode;

    tries.push({
      status: "started",
      try: 0,
      startDate: new Date(),
      node: nextNode,
    });

    if (nextNode.type === "synchronize") {
      progress.next = "locked";
    }

    return nextNode;
  }

  return null;
};

const startDate = new Date();

const getResult: DoProps["getResult"] = async () => {
  return {
    startDate,
    endDate: new Date(),
    tries,
    points,
    maxPoints: tries.filter((p) => p.node.type === "task" && p.try === 0)
      .length,
  };
};

const getPrevious: DoProps["getPrevious"] = async () => {
  const prevNode = await previous({
    currentId: currentNode.id,
    nodes: flow.nodes,
    edges: flow.edges,
  });

  if (prevNode !== null && isInteractiveFlowNode(prevNode)) {
    currentNode = prevNode;
  } else {
    return null;
  }

  tries.push({
    status: "started",
    node: extractInteractiveFlowPublicNode(prevNode as InteractiveFlowNode),
    startDate: new Date(),
    try: 0,
  });

  return prevNode;
};

const onRetry: DoProps["onRetry"] = async () => {
  const lastPath = tries[tries.length - 1];
  tries.push({
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
    </Box>
  );
};
