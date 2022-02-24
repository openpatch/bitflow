import { updateStatistic } from "../src/updateStatistic";
import { task } from "./fixtures";

describe("updateStatistic", () => {
  it("should work without an initial statistic", async () => {
    const s = await updateStatistic({
      task,
      answer: { subtype: "highlighting", yes: true },
    });
    expect(s).toEqual({
      count: 1,
      no: 0,
      yes: 1,
      subtype: "highlighting",
    });
  });
  it("should work with an initial statistic", async () => {
    const s = await updateStatistic({
      task,
      answer: { subtype: "highlighting", yes: false },
      statistic: {
        count: 49,
        no: 30,
        yes: 19,
        subtype: "highlighting",
      },
    });
    expect(s).toEqual({
      count: 50,
      no: 31,
      yes: 19,
      subtype: "highlighting",
    });
  });
});
