export const rank = (values: number[]): number[] => {
  const sorted = [...values].sort((a, b) => b - a);
  return values.map((x) => sorted.indexOf(x) + 1);
};
