import { Flow } from "@bitflow/core";

export const getStarted: Flow = {
  name: "Get Started",
  description: "",
  language: "en",
  visibility: "public",
  draft: false,
  nodes: [
    {
      id: "1",
      position: {
        x: 51,
        y: 311,
      },
      type: "start",
      data: {
        name: "Start",
        description: "",
        subtype: "simple",
        view: {
          title: "Start",
          markdown: "",
        },
      },
    },
    {
      id: "2",
      position: {
        x: 1063,
        y: 222,
      },
      type: "end",
      data: {
        name: "End",
        description: "",
        subtype: "tries",
        view: {
          markdown: "",
        },
      },
    },
    {
      id: "3",
      position: {
        x: 269,
        y: 85,
      },
      type: "task",
      data: {
        name: "Primitive Data Types",
        description: "",
        subtype: "choice",
        view: {
          instruction: "",
          variant: "single",
          choices: [
            {
              markdown: "",
            },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: false,
          showFeedback: false,
          correct: [],
        },
        feedback: {
          patterns: {},
          choices: {},
        },
      },
    },
  ],
  edges: [
    {
      id: "1",
      source: "1",
      sourceHandle: "a",
      target: "3",
    },
    {
      id: "2",
      source: "3",
      sourceHandle: "a",
      target: "2",
    },
  ],
  zoom: 0.8,
  position: [800, 0],
}
