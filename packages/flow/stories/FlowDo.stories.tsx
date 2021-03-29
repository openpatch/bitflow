import { TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import {
  GetAnswers,
  GetPoints,
  GetResults,
  next,
  previous,
} from "../src/engine";
import { FlowConfig, FlowDo, FlowDoProps, FlowProgress } from "../src/FlowDo";
import { IFlow, IFlowNode } from "../src/schemas";

export default {
  title: "Flow/FlowDo",
  component: FlowDo,
} as Meta;

const flow: IFlow = {
  draft: false,
  name: "Test",
  edges: [
    {
      id: "acfd47f0-322c-4008-9683-5ba693970faf",
      source: "a65312cc-fbab-4450-b845-590c3544b423",
      target: "26fbb5b5-d555-4ce2-9f12-d6e8a06cc5f3",
    },
    {
      id: "3e3710de-5033-4675-a569-bdb1f330b365",
      source: "26fbb5b5-d555-4ce2-9f12-d6e8a06cc5f3",
      sourceHandle: "a",
      target: "4ac5e850-e9df-47a3-9b81-76c019e09e3e",
    },
    {
      id: "d732f0a6-d323-4bad-b941-26473994ec97",
      source: "26fbb5b5-d555-4ce2-9f12-d6e8a06cc5f3",
      sourceHandle: "a",
      target: "80eaa994-c767-4d3e-8fe0-16e2754be8c7",
    },
    {
      id: "d6fef093-30ba-44bd-9dfa-90c8882961b1",
      source: "4ac5e850-e9df-47a3-9b81-76c019e09e3e",
      target: "306b2114-560e-4f8f-ab8a-5c116d6e00ba",
    },
    {
      id: "e5556f88-74f2-44ce-b66c-7dd9daa61f76",
      source: "80eaa994-c767-4d3e-8fe0-16e2754be8c7",
      target: "306b2114-560e-4f8f-ab8a-5c116d6e00ba",
    },
  ],
  nodes: [
    {
      type: "start",
      id: "a65312cc-fbab-4450-b845-590c3544b423",
      position: { x: 0, y: 0 },
      data: {
        view: {
          markdown: "Hi this is an assessment",
          title: "My Assessment",
        },
      },
    },
    {
      type: "end",
      id: "306b2114-560e-4f8f-ab8a-5c116d6e00ba",
      position: { x: 0, y: 0 },
      data: {
        view: {
          markdown: "Thank you for participating",
          listResults: false,
          showPoints: true,
        },
      },
    },
    {
      type: "split-random",
      id: "26fbb5b5-d555-4ce2-9f12-d6e8a06cc5f3",
      position: { x: 0, y: 0 },
    },
    {
      type: "title",
      id: "4ac5e850-e9df-47a3-9b81-76c019e09e3e",
      position: { x: 0, y: 0 },
      data: {
        subtype: "simple",
        description: "Title Description",
        name: "Title Name",
        view: {
          title: "A title",
          message: "**a** message",
        },
      },
    },
    {
      type: "task",
      id: "80eaa994-c767-4d3e-8fe0-16e2754be8c7",
      position: { x: 0, y: 0 },
      data: {
        subtype: "choice",
        description: "Description",
        name: "Choice",
        view: {
          choices: [
            {
              markdown: "Choice A",
            },
            {
              markdown: "ChoiceB",
            },
          ],
          instruction: "Instructions",
          variant: "single",
        },
        evaluation: {
          correct: ["a"],
          enableRetry: true,
          mode: "auto",
          showFeedback: true,
        },
        feedback: {
          choices: {},
          patterns: {},
        },
      },
    },
  ],
};

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
