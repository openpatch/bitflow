export const arithmeticMean = (values: number[]): number => {
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

export const geometricMean = (values: number[]): number => {
  const prod = values.reduce((acc, value) => acc * value, 1);
  return Math.pow(prod, 1 / values.length);
};

export const harmonicMean = (values: number[]): number => {
  const sum = values.reduce((acc, value) => acc + 1 / value);
  return values.length / sum;
};
