import { IStatistic } from "../src/types";
import { updateStatistic } from "../src/updateStatistic";

describe("updateStatistic", () => {
  it("should work with empty statistic", async () => {
    const statistic = await updateStatistic({
      answer: {
        subtype: "fill-in-the-blank",
        blanks: { a: "answer" },
      },
      result: {
        subtype: "fill-in-the-blank",
        blanks: {
          a: {
            state: "correct",
          },
        },
        state: "correct",
        feedback: [],
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
      subtype: "fill-in-the-blank",
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
        subtype: "fill-in-the-blank",
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
        subtype: "fill-in-the-blank",
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
      subtype: "fill-in-the-blank",
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
