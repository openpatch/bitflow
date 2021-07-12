import { options } from "./schemas";
import { TaskBit } from "./types";

export const updateStatistic: TaskBit["updateStatistic"] = ({
  answer,
  statistic,
  task,
}) =>
  new Promise((resolve) => {
    let pattern: string = "";

    task.view.choices.forEach((_, i) => {
      const c = options[i];
      const checked = answer?.checked[c] || false;

      if (checked) {
        pattern += c;
      }
    });

    const correctPattern = task.evaluation.correct.sort().join("");
    pattern = pattern.split("").sort().join("");

    resolve({
      subtype: "choice",
      count: (statistic?.count || 0) + 1,
      patterns: {
        ...statistic?.patterns,
        [pattern]: {
          count: (statistic?.patterns?.[pattern]?.count || 0) + 1,
          correct: correctPattern === pattern,
        },
      },
    });
  });
