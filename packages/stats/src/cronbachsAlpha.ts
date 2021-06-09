import { variance } from "./variability";

export const cronbachsAlpha = (values: number[][]): number => {
  let n = values.length;
  let N = values[0].length;
  let varSum = 0;
  let total: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i].length !== N) {
      throw new Error("unmatched lengths");
    }

    const varCol = variance(values[i]);
    varSum += varCol;

    for (let p = 0; p < N; p++) {
      if (!total[p]) {
        total.push(0);
      }
      total[p] += values[i][p];
    }
  }

  const varTotal = variance(total);

  return (n / (n - 1)) * ((varTotal - varSum) / varTotal);
};
