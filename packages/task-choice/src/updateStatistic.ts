import { UpdateStatistic } from "@openpatch/bits-base";
import {
  IAnswer,
  IEvaluation,
  IFeedback,
  IResult,
  IStatistic,
  ITask,
  Option,
  options,
} from "./types";

export const updateStatistic: UpdateStatistic<
  IStatistic,
  IAnswer,
  ITask,
  IResult,
  IEvaluation,
  IFeedback
> = ({ answer, evaluation, statistic, task, result }) =>
  new Promise((resolve) => {
    let pattern: string = "";

    task.choices.forEach((_, i) => {
      const c = options[i];
      const checked = answer?.checked[c] || false;

      if (checked) {
        pattern += c;
      }
    });

    pattern = pattern.split("").sort().join("");

    resolve({
      count: (statistic?.count || 0) + 1,
      patterns: {
        ...statistic?.patterns,
        [pattern]: {
          count: (statistic?.patterns?.[pattern]?.count || 0) + 1,
        },
      },
    });
  });
