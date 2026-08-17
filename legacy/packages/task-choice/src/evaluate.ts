import { options } from "./schemas";
import { IResult, TaskBit } from "./types";

export const evaluate: TaskBit["evaluate"] = async ({ answer, task }) => {
  const { view, evaluation, feedback } = task;
  let state: IResult["state"] = "unknown";
  const choices: IResult["choices"] = {};
  let pattern = "";
  let overallFeedback: IResult["feedback"] = undefined;

  if (evaluation && evaluation.mode === "auto") {
    state = "correct";
    view.choices.forEach((_, i) => {
      const c = options[i];
      const choice: IResult["choices"]["a"] = { state: "neutral" };

      const checked = answer?.checked[c] || false;
      const toBe = evaluation.correct.includes(c);

      if (checked) {
        pattern += c;
      }

      if (evaluation.showFeedback) {
        if (checked) {
          const checkedFeedback = feedback?.choices[c]?.checkedFeedback;
          if (checkedFeedback?.message) {
            choice.feedback = checkedFeedback;
          }
        } else {
          const notCheckedFeedback = feedback?.choices[c]?.notCheckedFeedback;
          if (notCheckedFeedback?.message) {
            choice.feedback = notCheckedFeedback;
          }
        }
      }

      if (checked !== toBe) {
        choice.state = "wrong";
        state = "wrong";
      } else {
        choice.state = "correct";
      }

      choices[c] = choice;
    });
    // sort pattern alphabetically
    pattern = pattern.split("").sort().join("");

    if (
      evaluation.showFeedback &&
      feedback?.patterns[pattern] &&
      feedback?.patterns[pattern]?.message
    ) {
      overallFeedback = feedback?.patterns[pattern];
    }
  }

  if (evaluation?.mode === "manual") {
    state = "manual";
  }

  return {
    subtype: "choice",
    state,
    choices,
    feedback: overallFeedback,
    allowRetry: evaluation?.enableRetry,
  };
};
