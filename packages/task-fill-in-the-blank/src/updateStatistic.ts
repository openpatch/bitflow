import { UpdateTaskStatistic } from "@bitflow/base";
import { ITask } from "./schemas";
import { IAnswer, IResult, IStatistic } from "./types";

export const updateStatistic: UpdateTaskStatistic<
  IStatistic,
  IAnswer,
  ITask,
  IResult
> = async ({ answer, statistic, task, result }) => {
  const blanks = statistic?.blanks || {};

  Object.entries(answer.blanks).forEach(([id, value]) => {
    let blank = blanks[id] || {};
    if (!blank[value]) {
      blank[value] = {
        correct: result?.blanks[id].state === "correct",
        count: 1,
      };
    } else {
      blank[value].count += 1;
    }
    blanks[id] = blank;
  });

  return {
    count: (statistic?.count || 0) + 1,
    blanks,
  };
};
