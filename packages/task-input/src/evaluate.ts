import { IResult, TaskBit } from "./types";

export const evaluate: TaskBit["evaluate"] = async ({ answer, task }) => {
  const { evaluation, feedback } = task;
  let state: IResult["state"] = "unknown";
  let overallFeedback: IResult["feedback"] = [];

  if (evaluation && evaluation.mode === "auto") {
    const pattern = evaluation.pattern;

    try {
      const regex = new RegExp(pattern);
      if (regex.test(answer?.input || "")) {
        state = "correct";
      } else {
        state = "wrong";
      }
    } catch (e) {}

    if (evaluation.showFeedback) {
      feedback.patterns.forEach((feedback) => {
        try {
          const regex = new RegExp(feedback.pattern);
          if (regex.test(answer?.input || "")) {
            overallFeedback?.push(feedback.feedback);
          }
        } catch (e) {}
      });
    }
  }

  if (evaluation?.mode === "manual") {
    state = "manual";
  }

  return {
    subtype: "input",
    state,
    feedback: overallFeedback,
    allowRetry: evaluation?.enableRetry,
  };
};
