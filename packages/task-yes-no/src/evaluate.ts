import { TaskBit } from "./types";

export const evaluate: TaskBit["evaluate"] = async ({ task, answer }) => {
  const evaluation = task.evaluation;

  if (evaluation.mode === "auto") {
    if (answer?.yes === evaluation.yes) {
      return {
        state: "correct",
        subtype: "yes-no",
        allowRetry: task.evaluation.enableRetry,
      };
    }

    if (answer?.yes === true) {
      return {
        state: "wrong",
        subtype: "yes-no",
        allowRetry: task.evaluation.enableRetry,
        feedback: task.evaluation.showFeedback ? task.feedback.yes : undefined,
      };
    } else {
      return {
        state: "wrong",
        subtype: "yes-no",
        allowRetry: task.evaluation.enableRetry,
        feedback: task.evaluation.showFeedback ? task.feedback.no : undefined,
      };
    }
  }

  return {
    state: "manual",
    subtype: "yes-no",
    allowRetry: task.evaluation.enableRetry,
  };
};
