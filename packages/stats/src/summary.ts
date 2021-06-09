import { max } from "./max";
import { arithmeticMean } from "./mean";
import { median, quartile } from "./median";
import { min } from "./min";
import { standardDeviation, variance } from "./variability";

export const summary = (x: number[]) => {
  return {
    mean: arithmeticMean(x),
    median: median(x),
    max: max(x),
    min: min(x),
    lowerQuartile: quartile(x, "lower"),
    upperQuartile: quartile(x, "upper"),
    standardDeviation: standardDeviation(x),
    variance: variance(x),
  };
};
