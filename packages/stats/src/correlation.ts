import { rank } from "./rank";
import { covariance, standardDeviation } from "./variability";

export function pearsonsCorrelation(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const stdvX = standardDeviation(x);
  const stdvY = standardDeviation(y);

  return cov / (stdvX * stdvY);
}

export function spearmansCorrelation(x: number[], y: number[]): number {
  const rankX = rank(x);
  const rankY = rank(y);
  const cov = covariance(rankX, rankY);

  return cov / standardDeviation(rankX);
}
