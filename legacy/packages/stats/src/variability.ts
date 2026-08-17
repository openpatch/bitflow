import { arithmeticMean } from "./mean";

export const covariance = (x: number[], y: number[]): number => {
  if (x.length !== y.length) {
    throw new Error("unmatched lengths");
  }

  const meanX = arithmeticMean(x);
  const meanY = arithmeticMean(y);

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = y[i];

    sum += (xi - meanX) * (yi - meanY);
  }

  return sum / (x.length - 1);
};

export const variance = (values: number[]): number => {
  const mean = arithmeticMean(values);
  const sum = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0);

  return sum / (values.length - 1);
};

export const standardDeviation = (values: number[]): number => {
  const v = variance(values);
  return Math.sqrt(v);
};
