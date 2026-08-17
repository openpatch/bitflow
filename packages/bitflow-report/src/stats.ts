/**
 * Descriptive statistics, ported from the old `@bitflow/stats` package.
 *
 * Pure functions over arrays of numbers: no I/O, no network, no dependency on
 * anything bitflow-shaped. Everything here runs in the browser on data the page
 * already has.
 *
 * Several of the originals were quietly wrong; where the behaviour changed, the
 * comment says why.
 */

export const min = (values: number[]): number => Math.min(...values);
export const max = (values: number[]): number => Math.max(...values);

export const arithmeticMean = (values: number[]): number =>
  values.length === 0
    ? Number.NaN
    : values.reduce((sum, value) => sum + value, 0) / values.length;

export const geometricMean = (values: number[]): number =>
  values.length === 0
    ? Number.NaN
    : Math.pow(
        values.reduce((product, value) => product * value, 1),
        1 / values.length,
      );

export const harmonicMean = (values: number[]): number => {
  // The original omitted the initial value, so the first element was summed
  // as itself rather than as its reciprocal.
  if (values.length === 0) return Number.NaN;
  const sum = values.reduce((acc, value) => acc + 1 / value, 0);
  return values.length / sum;
};

/** Sorts a copy: the original sorted the caller's array in place. */
export const median = (values: number[]): number => {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = (sorted.length - 1) / 2;
  const floored = Math.floor(middle);
  return middle === floored
    ? sorted[floored]
    : (sorted[floored] + sorted[floored + 1]) / 2;
};

export type Quarter =
  | "first"
  | "lower"
  | "second"
  | "median"
  | "third"
  | "upper";

/**
 * Sorts first. The original assumed its input was already sorted and returned
 * nonsense otherwise, which is not something a caller could tell from the
 * signature.
 */
export const quartile = (values: number[], quarter: Quarter): number => {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;

  if (quarter === "second" || quarter === "median") return median(sorted);
  if (quarter === "first" || quarter === "lower") {
    return median(sorted.slice(0, Math.floor(middle)));
  }
  return median(sorted.slice(Math.ceil(middle)));
};

/**
 * Competition ranking, highest value first: equal values share a rank, and the
 * next distinct value skips the ranks they used up.
 */
export const rank = (values: number[]): number[] => {
  const sorted = [...values].sort((a, b) => b - a);
  return values.map((value) => sorted.indexOf(value) + 1);
};

/** Sample variance (n − 1), matching the old package. */
export const variance = (values: number[]): number => {
  if (values.length < 2) return Number.NaN;
  const mean = arithmeticMean(values);
  const sum = values.reduce((acc, value) => acc + (value - mean) ** 2, 0);
  return sum / (values.length - 1);
};

export const standardDeviation = (values: number[]): number =>
  Math.sqrt(variance(values));

export const covariance = (x: number[], y: number[]): number => {
  if (x.length !== y.length) {
    throw new Error("covariance needs two series of the same length");
  }
  if (x.length < 2) return Number.NaN;

  const meanX = arithmeticMean(x);
  const meanY = arithmeticMean(y);
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }
  return sum / (x.length - 1);
};

export const pearsonsCorrelation = (x: number[], y: number[]): number =>
  covariance(x, y) / (standardDeviation(x) * standardDeviation(y));

/**
 * Spearman's rho: Pearson's on the ranks.
 *
 * The original divided by the standard deviation of the x-ranks alone, leaving
 * out the y term, so it only agreed with the definition when both series
 * happened to have the same spread.
 */
export const spearmansCorrelation = (x: number[], y: number[]): number => {
  const rankX = rank(x);
  const rankY = rank(y);
  return (
    covariance(rankX, rankY) /
    (standardDeviation(rankX) * standardDeviation(rankY))
  );
};

/**
 * Cronbach's alpha over `items × learners`: how consistently the items measure
 * the same thing. `null` when there are too few items or no variance to speak
 * of, rather than a NaN or an Infinity presented as a reliability.
 */
export const cronbachsAlpha = (items: number[][]): number | null => {
  const itemCount = items.length;
  if (itemCount < 2) return null;

  const learnerCount = items[0].length;
  if (learnerCount < 2) return null;
  if (items.some((item) => item.length !== learnerCount)) {
    throw new Error("cronbachsAlpha needs one score per learner for every item");
  }

  let itemVarianceSum = 0;
  const totals = new Array<number>(learnerCount).fill(0);

  for (const item of items) {
    itemVarianceSum += variance(item);
    for (let learner = 0; learner < learnerCount; learner++) {
      totals[learner] += item[learner];
    }
  }

  const totalVariance = variance(totals);
  if (!Number.isFinite(totalVariance) || totalVariance === 0) return null;

  const alpha =
    (itemCount / (itemCount - 1)) *
    ((totalVariance - itemVarianceSum) / totalVariance);
  return Number.isFinite(alpha) ? alpha : null;
};

export type Summary = {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  lowerQuartile: number;
  upperQuartile: number;
  standardDeviation: number;
  variance: number;
};

export const summary = (values: number[]): Summary => ({
  count: values.length,
  mean: arithmeticMean(values),
  median: median(values),
  min: min(values),
  max: max(values),
  lowerQuartile: quartile(values, "lower"),
  upperQuartile: quartile(values, "upper"),
  standardDeviation: standardDeviation(values),
  variance: variance(values),
});

/**
 * Rounds to `digits` decimals and returns a *number*.
 *
 * The original returned a string and, because it tested its argument for
 * truthiness, returned `undefined` for zero — so a score of 0 rendered as
 * nothing at all.
 */
export const round = (value: number, digits = 2): number => {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

// --- tables -----------------------------------------------------------------

export type Table = {
  rows: string[];
  columns: string[];
  cells: (number | null)[][];
};

/**
 * `{ row1: { c1: 2, c3: 1 }, row2: { c1: 4, c2: 1 } }` becomes a rectangular
 * table, with `null` where a row had no value for a column.
 */
export const convertMapToTable = (
  map: Record<string, Record<string, number>>,
): Table => {
  const rows = Object.keys(map);
  const columns: string[] = [];
  for (const value of Object.values(map)) {
    for (const column of Object.keys(value)) {
      if (!columns.includes(column)) columns.push(column);
    }
  }

  const cells = rows.map((row) =>
    columns.map((column) => map[row][column] ?? null),
  );

  return { rows, columns, cells };
};

export const inverseTable = (table: Table): Table => ({
  rows: table.columns,
  columns: table.rows,
  cells: table.columns.map((_, column) =>
    table.rows.map((__, row) => table.cells[row][column]),
  ),
});

/** Drops rows with a gap, for the analyses that need a complete matrix. */
export const omitIncompleteRows = (
  table: Table,
): Table & { cells: number[][] } => {
  const kept = table.rows
    .map((row, index) => ({ row, cells: table.cells[index] }))
    .filter((entry) => !entry.cells.includes(null));

  return {
    rows: kept.map((entry) => entry.row),
    columns: table.columns,
    cells: kept.map((entry) => entry.cells as number[]),
  };
};
