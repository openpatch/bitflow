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
import { FlowConfig, FlowDo, FlowDoProps, FlowProgress } from "../src/FlowDo";
import { IFlowNode } from "../src/schemas";

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
  currentNode: 0,
  nextNode: "unlocked",
  estimatedNodes: flow.nodes.length,
  results: [],
  points: 0,
};

const submissions: Record<
  string,
  {
    answers: TaskAnswer[];
    results: TaskResult[];
  }
> = {};

let currentNode: IFlowNode = flow.nodes.find(
  (n) => n.type === "start"
) as IFlowNode;

const onEnd: FlowDoProps["onEnd"] = () => {
  console.log("end");
};

const onSkip: FlowDoProps["onSkip"] = () => {
  console.log("skip");
};

const evaluate: FlowDoProps["evaluate"] = async (answer) => {
  if (currentNode.type === "task") {
    const taskBit = taskBits[currentNode.data.subtype];

    const result = (await taskBit.evaluate({
      answer,
      task: currentNode.data,
    })) as TaskResult;

    progress.results.push({ ...result, nodeId: currentNode.id });

    if (!submissions[currentNode.id]) {
      submissions[currentNode.id] = {
        answers: [answer],
        results: [result],
      };

      if (result.state === "correct") {
        progress.points += 1;
      }
    } else {
      const lastResult =
        submissions[currentNode.id].results[
          submissions[currentNode.id].results.length - 1
        ];
      submissions[currentNode.id].answers.push(answer);
      submissions[currentNode.id].results.push(result);

      if (lastResult.state === "correct" && result.state !== "correct") {
        progress.points -= 1;
      } else if (lastResult.state !== "correct" && result.state === "correct") {
        progress.points += 1;
      }
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
  nodeIds.forEach((nid) => {
    if (nid in submissions && submissions[nid].answers.length > 0) {
      answers[nid] =
        submissions[nid].answers[submissions[nid].answers.length - 1];
    }
  });

  return answers;
};

const getResults: GetResults = async (nodeIds) => {
  const results: Record<string, TaskResult> = {};
  nodeIds.forEach((nid) => {
    if (nid in submissions && submissions[nid].results.length > 0) {
      results[nid] =
        submissions[nid].results[submissions[nid].results.length - 1];
    }
  });

  return results;
};

const getPoints: GetPoints = async () => {
  return progress.points;
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

  if (nextNode !== null) {
    currentNode = nextNode;
  }

  if (nextNode?.type === "synchronize") {
    progress.nextNode = "locked";
  }

  progress.currentNode += 1;

  return nextNode;
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

  progress.currentNode -= 1;

  return prevNode;
};

export const Default = () => {
  return (
    <Box position="absolute" height="100vh" width="100vw">
      <FlowDo
        onEnd={onEnd}
        onSkip={onSkip}
        evaluate={evaluate}
        getConfig={getConfig}
        getCurrent={getCurrent}
        getNext={getNext}
        getPrevious={getPrevious}
        getProgress={getProgress}
      />
    </Box>
  );
};
