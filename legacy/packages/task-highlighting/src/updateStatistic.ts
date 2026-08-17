import { TaskBit } from "./types";

const updateAvg = (avg: number, value: number, count: number) => {
  return (avg * count + value) / (count + 1);
};

export const updateStatistic: TaskBit["updateStatistic"] = async ({
  answer,
  task: { view },
  statistic,
  result,
}) => {
  if (!statistic) {
    statistic = {
      count: 0,
      avgAgreement: {
        maroon: 0,
        lavender: 0,
        orange: 0,
        blue: 0,
        yellow: 0,
      },
      highlights: {
        maroon: new Array(view.text.length).fill(0),
        lavender: new Array(view.text.length).fill(0),
        orange: new Array(view.text.length).fill(0),
        blue: new Array(view.text.length).fill(0),
        yellow: new Array(view.text.length).fill(0),
      },
      subtype: "highlighting",
    };
  }

  answer.highlights.forEach((h, i) => {
    if (statistic && h !== null) {
      statistic.highlights[h][i] += 1;
    }
  });

  return {
    ...statistic,
    count: statistic.count + 1,
    avgAgreement: {
      maroon: updateAvg(
        statistic.avgAgreement.maroon,
        result?.agreement.maroon || 0,
        statistic.count
      ),
      lavender: updateAvg(
        statistic.avgAgreement.lavender,
        result?.agreement.lavender || 0,
        statistic.count
      ),
      orange: updateAvg(
        statistic.avgAgreement.orange,
        result?.agreement.orange || 0,
        statistic.count
      ),
      blue: updateAvg(
        statistic.avgAgreement.blue,
        result?.agreement.blue || 0,
        statistic.count
      ),
      yellow: updateAvg(
        statistic.avgAgreement.yellow,
        result?.agreement.yellow || 0,
        statistic.count
      ),
    },
  };
};
