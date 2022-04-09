import { ITask } from "../src/types";

export const task: ITask = {
  subtype: "highlighting",
  name: "Example",
  evaluation: {
    enableRetry: true,
    mode: "auto",
    showFeedback: true,
    highlights: [],
    cutoffs: {
      blue: 0,
      maroon: 0,
      orange: 0,
      yellow: 0,
      lavender: 0,
    },
  },
  feedback: {
    highlightAgreement: false,
  },
  view: {
    text: "Hallo",
    colors: {
      lavender: {
        enabled: true,
      },
      yellow: {
        enabled: false,
      },
      orange: {
        enabled: true,
      },
      maroon: {
        enabled: false,
      },
      blue: {
        enabled: false,
      },
    },
    instruction: "Test",
  },
};
