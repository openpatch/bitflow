import { describe, expect, it } from "vitest";
import {
  arithmeticMean,
  convertMapToTable,
  covariance,
  cronbachsAlpha,
  geometricMean,
  harmonicMean,
  inverseTable,
  max,
  median,
  min,
  omitIncompleteRows,
  pearsonsCorrelation,
  quartile,
  rank,
  round,
  spearmansCorrelation,
  standardDeviation,
  summary,
  variance,
} from "./stats";

describe("means", () => {
  it("computes the arithmetic mean", () => {
    expect(arithmeticMean([1, 2, 3, 4])).toBe(2.5);
  });

  it("computes the geometric mean", () => {
    expect(geometricMean([1, 4, 16])).toBeCloseTo(4, 10);
  });

  it("computes the harmonic mean", () => {
    // The old version omitted the reducer's initial value, so the first
    // element was added as itself rather than as its reciprocal, and this
    // returned 1.5 instead of 2.
    expect(harmonicMean([1, 4, 4])).toBe(2);
  });
});

describe("median and quartiles", () => {
  it("takes the middle of an odd-length series", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the middle two of an even-length series", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("does not reorder the caller's array", () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it("sorts before taking a quartile", () => {
    // Unsorted input: the old version read positions off the given order and
    // returned whatever happened to sit there.
    expect(quartile([7, 1, 5, 3], "lower")).toBe(2);
    expect(quartile([7, 1, 5, 3], "upper")).toBe(6);
    expect(quartile([7, 1, 5, 3], "median")).toBe(4);
  });
});

describe("rank", () => {
  it("ranks highest first", () => {
    expect(rank([10, 30, 20])).toEqual([3, 1, 2]);
  });

  it("gives tied values the same rank", () => {
    expect(rank([10, 20, 20])).toEqual([3, 1, 1]);
  });
});

describe("spread", () => {
  it("computes the sample variance", () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.571, 3);
  });

  it("computes the standard deviation", () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
  });

  it("computes covariance", () => {
    expect(covariance([1, 2, 3], [4, 5, 6])).toBe(1);
  });

  it("refuses two series of different lengths", () => {
    expect(() => covariance([1, 2], [1])).toThrow(/same length/);
  });
});

describe("correlation", () => {
  it("is 1 for a perfect positive relationship", () => {
    expect(pearsonsCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
  });

  it("is -1 for a perfect inverse relationship", () => {
    expect(pearsonsCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
  });

  it("matches a known value", () => {
    expect(pearsonsCorrelation([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])).toBeCloseTo(0.8, 10);
  });

  describe("spearman", () => {
    it("is 1 for a monotonic relationship, however curved", () => {
      // The old version divided by the x-ranks' standard deviation alone,
      // leaving out the y term, so this came out at 1 only by coincidence.
      expect(spearmansCorrelation([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 10);
    });

    it("is -1 when the order is exactly reversed", () => {
      expect(spearmansCorrelation([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
    });
  });
});

describe("cronbachsAlpha", () => {
  it("matches a worked example", () => {
    // Three items, six learners. By hand: each item's variance is 0.3, so the
    // item variances sum to 0.9; the totals 3,2,2,1,1,0 have variance 1.1;
    // alpha = (3/2) x (1.1 - 0.9) / 1.1.
    const items = [
      [1, 1, 1, 0, 0, 0],
      [1, 1, 0, 1, 0, 0],
      [1, 0, 1, 0, 1, 0],
    ];
    expect(cronbachsAlpha(items)).toBeCloseTo(0.2727, 4);
  });

  it("is inflated by a padded item, which is why callers must not pad", () => {
    // The same three items as above, plus a fourth that only the first three
    // learners reached, padded with 0 for the rest — what the group report
    // used to do on a branching flow.
    const common = [
      [1, 1, 1, 0, 0, 0],
      [1, 1, 0, 1, 0, 0],
      [1, 0, 1, 0, 1, 0],
    ];
    const padded = [...common, [1, 1, 0, 0, 0, 0]];

    // 0.27 is a test you would not trust; 0.62 looks like one you nearly
    // would. The padding invented the difference, by making "never saw it"
    // look like agreement between items.
    expect(cronbachsAlpha(common)).toBeCloseTo(0.2727, 4);
    expect(cronbachsAlpha(padded)).toBeCloseTo(0.6154, 4);
  });

  it("is 1 for items that agree perfectly", () => {
    const items = [
      [1, 0, 1, 0],
      [1, 0, 1, 0],
      [1, 0, 1, 0],
    ];
    expect(cronbachsAlpha(items)).toBeCloseTo(1, 10);
  });

  it("is null rather than a number when there is too little to go on", () => {
    expect(cronbachsAlpha([[1, 0, 1]])).toBeNull();
    expect(cronbachsAlpha([[1], [0]])).toBeNull();
    // Everyone scored the same: total variance is zero, and the formula would
    // divide by it.
    expect(
      cronbachsAlpha([
        [1, 1, 1],
        [1, 1, 1],
      ]),
    ).toBeNull();
  });

  it("refuses a ragged matrix", () => {
    expect(() => cronbachsAlpha([[1, 0], [1]])).toThrow(/every item/);
  });
});

describe("summary", () => {
  it("describes a distribution", () => {
    expect(summary([1, 2, 3, 4])).toMatchObject({
      count: 4,
      mean: 2.5,
      median: 2.5,
      min: 1,
      max: 4,
      lowerQuartile: 1.5,
      upperQuartile: 3.5,
    });
  });
});

describe("round", () => {
  it("rounds to two decimals by default", () => {
    expect(round(1.23456)).toBe(1.23);
    expect(round(1.23456, 3)).toBe(1.235);
  });

  it("returns zero rather than nothing", () => {
    // The old version tested its argument for truthiness and returned
    // `undefined` for 0, so a score of zero rendered as an empty cell.
    expect(round(0)).toBe(0);
  });

  it("leaves a non-finite value alone", () => {
    expect(round(Number.NaN)).toBeNaN();
  });
});

describe("min and max", () => {
  it("find the extremes", () => {
    expect(min([3, 1, 2])).toBe(1);
    expect(max([3, 1, 2])).toBe(3);
  });
});

describe("tables", () => {
  const map = { row1: { c1: 2, c3: 1 }, row2: { c1: 4, c2: 1 } };

  it("turns a map of maps into a rectangle", () => {
    expect(convertMapToTable(map)).toEqual({
      rows: ["row1", "row2"],
      columns: ["c1", "c3", "c2"],
      cells: [
        [2, 1, null],
        [4, null, 1],
      ],
    });
  });

  it("transposes", () => {
    expect(inverseTable(convertMapToTable(map))).toEqual({
      rows: ["c1", "c3", "c2"],
      columns: ["row1", "row2"],
      cells: [
        [2, 4],
        [1, null],
        [null, 1],
      ],
    });
  });

  it("drops rows with a gap", () => {
    expect(omitIncompleteRows(convertMapToTable(map))).toEqual({
      rows: [],
      columns: ["c1", "c3", "c2"],
      cells: [],
    });
  });
});
