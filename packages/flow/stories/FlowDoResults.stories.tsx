import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { FlowDoResults } from "../src";

export default {
  title: "Flow/FlowDoResults",
  component: FlowDoResults,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Box height="100vh">
    <FlowDoResults
      edges={[
        {
          id: "edge-1",
          source: "node-2",
          target: "node-1",
          type: "correlation",
          data: {
            correlation: 0.1,
          },
        },
        {
          id: "edge-2",
          source: "start",
          target: "bit",
          data: {
            correlation: 0.2,
          },
        },
      ]}
      nodes={[
        {
          id: "start",
          type: "start",
          position: { x: 0, y: 5 },
          data: {
            result: {
              avgTime: 0,
              avgTries: 0,
              status: {
                finished: 40,
                skipped: 100,
                started: 800,
              },
            },
            view: {
              markdown: "",
              title: "",
            },
          },
        },
        {
          id: "task",
          type: "task",
          position: { x: 250, y: 200 },
          data: {
            subtype: "input",
            view: {
              instruction: "",
            },
            description: "",
            feedback: {
              patterns: [],
            },
            name: "A input task",
            result: {
              avgTime: 0,
              avgTries: 0,
              status: {
                finished: 40,
                skipped: 100,
                started: 800,
              },
              difficulty: 0.5,
              discriminationIndex: 0.1,
              states: {
                correct: 0,
                manual: 0,
                unknown: 0,
                wrong: 0,
              },
            },
            evaluation: {
              enableRetry: false,
              mode: "auto",
              pattern: "",
              showFeedback: true,
            },
          },
        },
        {
          id: "node-1",
          type: "synchronize",
          position: { x: 250, y: 25 },
          data: {
            state: "locked",
            result: {
              avgTime: 0,
              avgTries: 0,
              status: {
                finished: 0,
                skipped: 0,
                started: 0,
              },
            },
          },
        },
        {
          id: "node-2",
          type: "checkpoint",
          position: { x: 100, y: 5 },
          data: {
            result: {
              avgTime: 0,
              avgTries: 0,
              count: 1,
              status: {
                finished: 0,
                skipped: 0,
                started: 0,
              },
            },
          },
        },
        {
          id: "node-3",
          type: "split-random",
          position: { x: 100, y: 25 },
        },
        {
          id: "end",
          type: "end",
          position: { x: 400, y: 5 },
          data: {
            result: {
              avgTime: 0,
              avgTries: 0,
              count: 1,
              status: {
                finished: 0,
                skipped: 0,
                started: 0,
              },
            },
            view: {
              listResults: false,
              markdown: "",
              showPoints: true,
            },
          },
        },
        {
          id: "bit",
          type: "title",
          position: { x: 100, y: 0 },
          data: {
            subtype: "simple",
            description: "A description",
            name: "Name",
            result: {
              avgTime: 0,
              avgTries: 0,
              status: {
                finished: 0,
                skipped: 0,
                started: 0,
              },
            },
            view: {
              message: "A title message",
              title: "",
            },
          },
        },
        {
          id: "bit-2",
          type: "input",
          position: { x: 100, y: -10 },
          data: {
            subtype: "markdown",
            name: "Name",
            description:
              "A description. This is a super long description and other stuff. How is this handled by the flow?",
            result: {
              avgTime: 0,
              avgTries: 0,
              count: 1,
              status: {
                finished: 0,
                skipped: 0,
                started: 0,
              },
            },
            view: {
              markdown: "A title message",
            },
          },
        },
      ]}
    />
  </Box>
);
