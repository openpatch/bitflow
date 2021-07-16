import { IResult, TaskBit } from "./types";

export const evaluate: TaskBit["evaluate"] = async ({ answer, task }) => {
  const { evaluation, feedback } = task;
  let state: IResult["state"] = "unknown";
  let overallFeedback: IResult["feedback"] = [];

  const blankResults: IResult["blanks"] = {};

  if (evaluation && evaluation.mode === "auto") {
    const blanks = evaluation.blanks;

    Object.entries(blanks).forEach(([id, pattern]) => {
      const answerValue = answer?.blanks?.[id] || "";
      blankResults[id] = { state: "neutral" };
      try {
        const regex = new RegExp(pattern);
        if (regex.test(answerValue)) {
          if (state === "unknown") {
            state = "correct";
          }
          blankResults[id].state = "correct";
        } else {
          state = "wrong";
          blankResults[id].state = "wrong";
        }
      } catch (e) {}
      if (evaluation.showFeedback && feedback.blanks[id]) {
        feedback.blanks[id].patterns.forEach((feedback) => {
          try {
            const regex = new RegExp(feedback.pattern);
            if (regex.test(answerValue)) {
              overallFeedback?.push(feedback.feedback);
            }
          } catch (e) {}
        });
      }
    });
  }

  if (evaluation?.mode === "manual") {
    state = "manual";
  }

  return {
    subtype: "fill-in-the-blank",
    state,
    blanks: blankResults,
    feedback: overallFeedback,
    allowRetry: evaluation?.enableRetry,
  };
};
