import {
  DoResult,
  extractInteractiveFlowPublicNode,
  finishDoTry,
  Flow,
  InteractiveFlowNode,
  isFlowStartNode,
  isInteractiveFlowNode,
  makeEvaluate,
} from "@bitflow/core";
import { Do, DoConfig, DoProgress, DoProps } from "@bitflow/do";
import {
  collectAnswers,
  collectResults,
  next,
  previous,
} from "@bitflow/flow-engine";
import { evaluate as choiceEvaluate } from "@bitflow/task-choice";
import { Box, Card, PatternCenter } from "@openpatch/patches";

// FLOW
const flow: Flow = {
  draft: false,
  edges: [
    {
      id: "edge-1",
      source: "start-node",
      target: "task-node",
    },
    {
      id: "edge-2",
      source: "task-node",
      target: "end-node",
    },
  ],
  name: "Example",
  nodes: [
    {
      id: "start-node",
      position: { x: 0, y: 0 },
      type: "start",
      data: {
        subtype: "simple",
        description: "",
        name: "Start",
        view: {
          markdown:
            "This is a demo assessment. It just consists of one choice bit. Enjoy :)",
          title: "Welcome!",
        },
      },
    },
    {
      type: "task",
      id: "task-node",
      position: { x: 0, y: 0 },
      data: {
        description: "",
        evaluation: {
          correct: ["a"],
          enableRetry: true,
          mode: "auto",
          showFeedback: true,
        },
        feedback: {
          patterns: {},
          choices: {
            c: {
              checkedFeedback: {
                message: "It is a trap!",
                severity: "warning",
              },
            },
          },
        },
        name: "Definition Bitflow",
        subtype: "choice",
        view: {
          instruction: "What is Bitflow?",
          variant: "single",
          choices: [
            { markdown: "Ice Cream" },
            { markdown: "Assessment Library" },
            { markdown: "**Click me**" },
          ],
        },
      },
    },
    {
      id: "end-node",
      position: { x: 0, y: 0 },
      type: "end",
      data: {
        subtype: "tries",
        description: "",
        name: "End",
        view: {
          markdown: "# Your results",
        },
      },
    },
  ],
};

// CONFIGURATION
const doConfig: DoConfig = {
  soundUrls: {
    correct: "/correct.mp3",
    wrong: "/wrong.mp3",
    unknown: "/unknown.mp3",
    manual: "/manual.mp3",
  },
};

// GLOBAL STATE
const doProgress: DoProgress = {
  currentNodeIndex: 0,
  nextNodeState: "unlocked",
  estimatedNodes: flow.nodes.length - 1,
};
let doResult: DoResult = {
  points: 0,
  maxPoints: 0,
  tries: [],
  endDate: new Date(),
  startDate: new Date(),
};

let currentNode = flow.nodes.find(isFlowStartNode) as InteractiveFlowNode;

// DO FUNCTIONS
const onEnd: DoProps["onEnd"] = async () => {
  console.log("The End!");
};
const onSkip: DoProps["onSkip"] = async () => {
  const { tries } = doResult;
  const currentTry = tries[tries.length - 1];
  tries[tries.length - 1] = {
    ...currentTry,
    status: "skipped",
    endDate: new Date(),
  };
};

const taskEvaluate = makeEvaluate({
  choice: choiceEvaluate as any,
});

const evaluate: DoProps["evaluate"] = async (answer) => {
  if (currentNode?.type !== "task") {
    throw new Error("type not supported");
  }
  // evaluate the answer
  let result = await taskEvaluate({ answer, task: currentNode.data });
  doResult = finishDoTry(doResult, answer, result);

  return result;
};

const getConfig: DoProps["getConfig"] = async () => {
  return doConfig;
};

const getCurrent: DoProps["getCurrent"] = async () => {
  if (!currentNode) {
    throw new Error("no current node");
  }
  return currentNode;
};

const getNext: DoProps["getNext"] = async () => {
  const { tries, points } = doResult;
  if (currentNode) {
    const nextNode = await next({
      currentId: currentNode.id,
      nodes: flow.nodes,
      edges: flow.edges,
      getAnswers: async (nodeIds) => collectAnswers(tries, nodeIds),
      getResults: async (nodeIds) => collectResults(tries, nodeIds),
      getPoints: async () => points,
    });

    if (nextNode && isInteractiveFlowNode(nextNode)) {
      currentNode = nextNode;
      tries.push({
        status: "started",
        try: 0,
        startDate: new Date(),
        node: extractInteractiveFlowPublicNode(nextNode),
      });

      doProgress.currentNodeIndex += 1;
      return nextNode;
    }
  }
  return null;
};

const getResult: DoProps["getResult"] = async () => {
  return doResult;
};

const getPrevious: DoProps["getPrevious"] = async () => {
  const { tries } = doResult;
  if (currentNode) {
    const prevNode = await previous({
      currentId: currentNode.id,
      nodes: flow.nodes,
      edges: flow.edges,
    });

    if (prevNode && isInteractiveFlowNode(prevNode)) {
      currentNode = prevNode;
      tries.push({
        status: "started",
        node: extractInteractiveFlowPublicNode(prevNode),
        startDate: new Date(),
        try: 0,
      });

      doProgress.currentNodeIndex -= 1;
      return prevNode;
    }
  }
  return null;
};

const getProgress: DoProps["getProgress"] = async () => {
  return doProgress;
};

const onRetry: DoProps["onRetry"] = async () => {
  const { tries } = doResult;
  const lastTry = tries[tries.length - 1];
  tries.push({
    status: "started",
    try: lastTry.try + 1,
    startDate: new Date(),
    node: {
      ...lastTry.node,
    },
  });
};

export default function Index({}) {
  return (
    <PatternCenter>
      <Card>
        <Box position="relative" height="90vh" width="90vw">
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
      </Card>
    </PatternCenter>
  );
}
