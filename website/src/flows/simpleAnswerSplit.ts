import { Flow } from "@bitflow/core";

export const simpleAnswerSplit: Flow = {
  name: "New Flow",
  draft: false,
  nodes: [
    {
      id: "deb8e3b9-28a4-47f9-902c-a729b9be5569",
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
      id: "08a2cb15-c51c-4186-9c7d-73f4af90c3b3",
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
      id: "5b9bbbfb-e655-4e2e-91e1-060fc62331a4",
      position: {
        x: 269.3999938964844,
        y: 85.60000610351562,
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
    {
      id: "296f2268-535a-49c0-b7da-60f02eb11fa1",
      position: {
        x: 815.3999938964844,
        y: 83.60000610351562,
      },
      type: "task",
      data: {
        name: "For-Loop Prediction",
        description: "",
        subtype: "input",
        view: {
          instruction: "",
        },
        evaluation: {
          mode: "auto",
          enableRetry: false,
          showFeedback: false,
          pattern: "",
        },
        feedback: {
          patterns: [],
        },
      },
    },
    {
      id: "206a8d72-7229-40df-9a0c-d1556ef3d0df",
      position: {
        x: 487.3999938964844,
        y: 263.6000061035156,
      },
      type: "split-answer",
      data: {
        condition: {
          type: "true",
          not: false,
          nodeId: "",
          key: "",
        },
      },
    },
    {
      id: "d5c59bf3-8d42-463d-b9df-615a0172cd6a",
      position: {
        x: 862.3999938964844,
        y: 383.6000061035156,
      },
      type: "task",
      data: {
        name: "Method Calls",
        description: "",
        subtype: "input",
        view: {
          instruction: "",
        },
        evaluation: {
          mode: "auto",
          enableRetry: false,
          showFeedback: false,
          pattern: "",
        },
        feedback: {
          patterns: [],
        },
      },
    },
  ],
  edges: [
    {
      id: "a50ba7fb-bb14-49a3-bf29-5144d783152d",
      source: "296f2268-535a-49c0-b7da-60f02eb11fa1",
      sourceHandle: "a",
      target: "08a2cb15-c51c-4186-9c7d-73f4af90c3b3",
    },
    {
      id: "2ae05be6-1c63-4fd3-a4e7-f7f650b943a5",
      source: "deb8e3b9-28a4-47f9-902c-a729b9be5569",
      sourceHandle: "a",
      target: "5b9bbbfb-e655-4e2e-91e1-060fc62331a4",
    },
    {
      id: "448e17d5-be6c-4815-b130-8f5106e5a25c",
      source: "5b9bbbfb-e655-4e2e-91e1-060fc62331a4",
      sourceHandle: "a",
      target: "206a8d72-7229-40df-9a0c-d1556ef3d0df",
    },
    {
      id: "c970639d-2999-4a45-9020-d4f61fc7b6a8",
      source: "206a8d72-7229-40df-9a0c-d1556ef3d0df",
      sourceHandle: "a",
      target: "296f2268-535a-49c0-b7da-60f02eb11fa1",
    },
    {
      id: "79ca0e17-9d5c-472a-93b9-224e1d4a7ced",
      source: "206a8d72-7229-40df-9a0c-d1556ef3d0df",
      sourceHandle: "b",
      target: "d5c59bf3-8d42-463d-b9df-615a0172cd6a",
    },
    {
      id: "77744ef6-fb0d-4095-8596-2c4955c68a08",
      source: "d5c59bf3-8d42-463d-b9df-615a0172cd6a",
      sourceHandle: "a",
      target: "08a2cb15-c51c-4186-9c7d-73f4af90c3b3",
    },
  ],
  zoom: 0.8,
  position: [800, 0],
};
