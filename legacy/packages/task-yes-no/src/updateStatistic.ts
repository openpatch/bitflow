import { TaskBit } from "./types";

export const updateStatistic: TaskBit["updateStatistic"] = async ({
  answer,
  statistic,
}) => {
  if (!statistic) {
    statistic = {
      count: 0,
      no: 0,
      yes: 0,
      subtype: "yes-no",
    };
  }
  return {
    ...statistic,
    count: statistic.count + 1,
    no: !answer.yes ? statistic.no + 1 : statistic.no,
    yes: answer.yes ? statistic.yes + 1 : statistic.yes,
  };
};
