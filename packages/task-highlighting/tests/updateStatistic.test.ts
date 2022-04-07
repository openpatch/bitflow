import { updateStatistic } from "../src/updateStatistic";
import { task } from "./fixtures";

describe("updateStatistic", () => {
  it("should work without an initial statistic", async () => {
    const s = await updateStatistic({
      task,
      answer: { subtype: "highlighting", highlights: ["maroon"] },
    });
    expect(s).toEqual({
      count: 1,
      avgAgreement: {
        lavender: 0,
        yellow: 0,
        orange: 0,
        blue: 0,
        maroon: 0,
      },
      highlights: {
        maroon: [1, 0, 0, 0, 0],
        blue: [0, 0, 0, 0, 0],
        orange: [0, 0, 0, 0, 0],
        yellow: [0, 0, 0, 0, 0],
        lavender: [0, 0, 0, 0, 0],
      },
      subtype: "highlighting",
    });
  });
  it("should work with an initial statistic", async () => {
    const s = await updateStatistic({
      task,
      answer: {
        subtype: "highlighting",
        highlights: ["maroon", "blue", "maroon", null, null],
      },
      statistic: {
        count: 0,
        avgAgreement: {
          lavender: 0,
          yellow: 0,
          orange: 0,
          blue: 0,
          maroon: 0,
        },
        highlights: {
          maroon: [0, 0, 0, 0, 0],
          blue: [0, 0, 0, 0, 0],
          orange: [0, 0, 0, 0, 0],
          yellow: [0, 0, 0, 0, 0],
          lavender: [0, 0, 0, 0, 0],
        },
        subtype: "highlighting",
      },
    });
    expect(s).toEqual({
      count: 1,
      avgAgreement: {
        lavender: 0,
        yellow: 0,
        orange: 0,
        blue: 0,
        maroon: 0,
      },
      highlights: {
        maroon: [1, 0, 1, 0, 0],
        blue: [0, 1, 0, 0, 0],
        orange: [0, 0, 0, 0, 0],
        yellow: [0, 0, 0, 0, 0],
        lavender: [0, 0, 0, 0, 0],
      },
      subtype: "highlighting",
    });
  });
});
