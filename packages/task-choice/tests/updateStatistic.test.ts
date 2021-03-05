import { IAnswer, IStatistic } from "../src/types";
import { updateStatistic } from "../src/updateStatistic";

describe("updateStatistic", () => {
  it("should work with empty statistic", async () => {
    const statistic = await updateStatistic({
      answer: {
        checked: { a: true },
      },
      task: {
        title: "A task",
        instruction: "An instruction",
        variant: "single",
        choices: [{ markdown: "Hallo" }],
      },
    });

    const expected: IStatistic = {
      count: 1,
      patterns: {
        a: {
          count: 1,
        },
      },
    };

    expect(statistic).toEqual(expected);
  });

  it("should work with precalculated statistic", async () => {
    const statistic = await updateStatistic({
      statistic: {
        count: 43,
        patterns: {
          a: {
            count: 42,
          },
        },
      },
      answer: {
        checked: { a: true },
      },
      task: {
        title: "A task",
        instruction: "An instruction",
        variant: "single",
        choices: [{ markdown: "Hallo" }],
      },
    });

    const expected: IStatistic = {
      count: 44,
      patterns: {
        a: {
          count: 43,
        },
      },
    };

    expect(statistic).toEqual(expected);
  });

  it("should work with multiple answers", async () => {
    const answers: IAnswer[] = [
      {
        checked: { a: true },
      },
      {
        checked: { a: true },
      },
      {
        checked: { a: true },
      },
      {
        checked: { a: true, b: true, c: false },
      },
      {
        checked: { a: true, b: false, c: true },
      },
    ];

    let statistic: IStatistic = await answers.reduce(
      async (statistic, answer) => {
        return await updateStatistic({
          statistic: await statistic,
          answer,
          task: {
            title: "A task",
            instruction: "An instruction",
            variant: "single",
            choices: [
              { markdown: "Hallo" },
              { markdown: "Hu" },
              { markdown: "Da" },
            ],
          },
        });
      },
      {} as Promise<IStatistic>
    );

    const expected: IStatistic = {
      count: answers.length,
      patterns: {
        a: {
          count: 3,
        },
        ab: {
          count: 1,
        },
        ac: {
          count: 1,
        },
      },
    };

    expect(statistic).toEqual(expected);
  });
});
