import { IAnswer, IStatistic } from "../src/types";
import { updateStatistic } from "../src/updateStatistic";

describe("updateStatistic", () => {
  it("should work with empty statistic", async () => {
    const statistic = await updateStatistic({
      answer: {
        checked: { a: true },
      },
      task: {
        subtype: "choice",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
          variant: "single",
          choices: [{ markdown: "Hallo" }],
        },
        evaluation: {
          correct: [],
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          choices: {},
          patterns: {},
        },
      },
    });

    const expected: IStatistic = {
      count: 1,
      patterns: {
        a: {
          count: 1,
          correct: false,
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
            correct: false,
          },
        },
      },
      answer: {
        checked: { a: true },
      },
      task: {
        subtype: "choice",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
          variant: "single",
          choices: [{ markdown: "Hallo" }],
        },
        evaluation: {
          correct: [],
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          choices: {},
          patterns: {},
        },
      },
    });

    const expected: IStatistic = {
      count: 44,
      patterns: {
        a: {
          correct: false,
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
            subtype: "choice",
            description: "desc",
            name: "name",
            view: {
              instruction: "An instruction",
              variant: "single",
              choices: [
                { markdown: "Hallo" },
                { markdown: "Hu" },
                { markdown: "Da" },
              ],
            },
            evaluation: {
              correct: ["a"],
              enableRetry: false,
              mode: "auto",
              showFeedback: false,
            },
            feedback: {
              choices: {},
              patterns: {},
            },
          },
        });
      },
      {} as Promise<IStatistic>
    );

    const expected: IStatistic = {
      count: answers.length,
      patterns: {
        a: {
          correct: true,
          count: 3,
        },
        ab: {
          correct: false,
          count: 1,
        },
        ac: {
          correct: false,
          count: 1,
        },
      },
    };

    expect(statistic).toEqual(expected);
  });
});
