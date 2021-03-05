import { Evaluate } from "@openpatch/bits-base";
import {
  IAnswer,
  IEvaluation,
  ITask,
  IResult,
  IFeedback,
  options,
} from "./types";

export const evaluate: Evaluate<
  IAnswer,
  IEvaluation,
  ITask,
  IResult,
  IFeedback
> = ({ answer, evaluation, task, feedback }) =>
  new Promise((resolve) => {
    let state: IResult["state"] = "unknown";
    const choices: IResult["choices"] = {};
    let pattern = "";
    let overallFeedback: IResult["feedback"] = undefined;

    if (evaluation && evaluation.mode === "auto") {
      let correct = true;
      state = "correct";
      task.choices.forEach((_, i) => {
        const c = options[i];
        const choice: IResult["choices"]["a"] = { state: "neutral" };

        const checked = answer?.checked[c] || false;
        const toBe = evaluation.correct.includes(c);

        if (checked) {
          pattern += c;
        }

        if (evaluation.showFeedback) {
          if (checked) {
            choice.feedback = feedback?.choices[c]?.checkedFeedback;
          } else {
            choice.feedback = feedback?.choices[c]?.checkedFeedback;
          }
        }

        if (checked !== toBe) {
          correct = false;
        }

        if (checked && !toBe) {
          choice.state = "wrong";
          state = "wrong";
        } else if (checked && toBe) {
          choice.state = "correct";
        }

        choices[c] = choice;
      });
      // sort pattern alphabetically
      pattern = pattern.split("").sort().join("");

      if (evaluation.showFeedback && feedback?.patterns[pattern]) {
        overallFeedback = feedback?.patterns[pattern];
      }
    }

    if (evaluation?.mode === "manual") {
      state = "manual";
    }

    resolve({
      state,
      choices,
      feedback: overallFeedback,
      allowRetry: evaluation?.enableRetry,
    });
  });
