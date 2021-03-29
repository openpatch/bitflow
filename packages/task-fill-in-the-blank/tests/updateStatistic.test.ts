import { IStatistic } from "../src/types";
import { updateStatistic } from "../src/updateStatistic";

describe("updateStatistic", () => {
  it("should work with empty statistic", async () => {
    const statistic = await updateStatistic({
      answer: {
        blanks: { a: "answer" },
      },
      result: {
        blanks: {
          a: {
            state: "correct",
          },
        },
        state: "correct",
      },
      task: {
        subtype: "fill-in-the-blank",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
          textWithBlanks: "~~a~~",
        },
        evaluation: {
          blanks: {
            a: "[aA]nswer",
          },
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          blanks: {},
        },
      },
    });

    const expected: IStatistic = {
      count: 1,
      blanks: {
        a: {
          answer: {
            correct: true,
            count: 1,
          },
        },
      },
    };

    expect(statistic).toEqual(expected);
  });

  it("should work with precalculated statistic", async () => {
    const statistic = await updateStatistic({
      statistic: {
        count: 43,
        blanks: {
          a: {
            hallo: {
              count: 1,
              correct: true,
            },
            answer: {
              count: 42,
              correct: false,
            },
          },
        },
      },
      answer: {
        blanks: { a: "hallo" },
      },
      task: {
        subtype: "fill-in-the-blank",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
          textWithBlanks: "~~a~~",
        },
        evaluation: {
          blanks: {
            a: "answer",
          },
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          blanks: {},
        },
      },
    });

    const expected: IStatistic = {
      count: 44,
      blanks: {
        a: {
          hallo: {
            count: 2,
            correct: true,
          },
          answer: {
            count: 42,
            correct: false,
          },
        },
      },
    };

    expect(statistic).toEqual(expected);
  });
});
