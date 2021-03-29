import { UpdateTaskStatistic } from "@bitflow/base";
import { ITask } from "./schemas";
import { IAnswer, IResult, IStatistic } from "./types";

export const updateStatistic: UpdateTaskStatistic<
  IStatistic,
  IAnswer,
  ITask,
  IResult
> = async ({ answer, statistic, task }) => {
  const { feedback, evaluation } = task;
  const patterns = statistic?.patterns || {};
  const { pattern } = evaluation;

  feedback.patterns.forEach((pattern) => {
    try {
      const regex = new RegExp(pattern.pattern);
      if (regex.test(answer.input)) {
        if (!patterns[pattern.pattern]) {
          patterns[pattern.pattern] = {
            count: 0,
          };
        }

        patterns[pattern.pattern].count += 1;
      }
    } catch (e) {}
  });

  let correct = false;

  try {
    const regex = new RegExp(pattern);
    if (regex.test(answer.input)) {
      correct = true;
    }
  } catch (e) {}

  return {
    count: (statistic?.count || 0) + 1,
    patterns,
    inputs: {
      ...statistic?.inputs,
      [answer.input]: {
        count: (statistic?.inputs?.[answer.input]?.count || 0) + 1,
        correct,
      },
    },
  };
};
