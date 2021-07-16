import { ITask } from "../src/types";

export const task: ITask = {
  subtype: "yes-no",
  name: "Example",
  evaluation: {
    enableRetry: true,
    mode: "auto",
    showFeedback: true,
    yes: true,
  },
  feedback: {},
  view: {
    question: "Example Question",
  },
};
