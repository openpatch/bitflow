export const round = (n?: number, digits = 2) =>
  (n
    ? Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)
    : n
  )?.toFixed(digits);
