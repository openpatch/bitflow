import { TaskBit } from "./types";

export const updateStatistic: TaskBit["updateStatistic"] = async ({
  answer,
  statistic,
  result,
}) => {
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
    subtype: "fill-in-the-blank",
    count: (statistic?.count || 0) + 1,
    blanks,
  };
};
