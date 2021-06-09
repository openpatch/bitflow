export const median = (x: number[]): number => {
  const sorted = x.sort((a, b) => a - b);
  const middle = (sorted.length - 1) / 2.0;
  const flooredMiddle = Math.floor(middle);
  if (middle == flooredMiddle) {
    return sorted[middle];
  }
  return (sorted[flooredMiddle] + sorted[flooredMiddle + 1]) / 2.0;
};

export const quartile = (
  x: number[],
  quarter: "first" | "lower" | "second" | "median" | "third" | "upper"
): number => {
  let middle = x.length / 2.0;
  if (quarter === "second" || quarter === "median") {
    return median(x);
  } else if (quarter === "first" || quarter === "lower") {
    const lowerHalf = x.slice(0, Math.floor(middle));
    return median(lowerHalf);
  } else if (quarter === "third" || quarter === "upper") {
    const upperHalf = x.slice(Math.ceil(middle), x.length);
    return median(upperHalf);
  }

  return 0;
};
