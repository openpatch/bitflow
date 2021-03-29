import { Evaluate } from "@bitflow/base";
import { ITask } from "./schemas";
import { IAnswer, IResult } from "./types";

export const evaluate: Evaluate<IAnswer, ITask, IResult> = async ({
  answer,
  task,
}) => {
  const { view, evaluation, feedback } = task;
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
          state = "correct";
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
    state,
    blanks: blankResults,
    feedback: overallFeedback,
    allowRetry: evaluation?.enableRetry,
  };
};
