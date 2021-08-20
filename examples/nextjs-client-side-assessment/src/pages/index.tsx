import { Flow } from "@bitflow/core";
import { DoLocal } from "@bitflow/do-local";
import { Box, Card, PatternCenter } from "@openpatch/patches";

// FLOW
const flow: Flow = {
  draft: false,
  description: "",
  language: "en",
  visibility: "public",
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
          correct: ["b"],
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

export default function Index({}) {
  return (
    <PatternCenter>
      <Card>
        <Box position="relative" height="90vh" width="90vw">
          <DoLocal flow={flow} />
        </Box>
      </Card>
    </PatternCenter>
  );
}
