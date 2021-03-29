import { IStatistic } from "../src/types";
import { updateStatistic } from "../src/updateStatistic";

describe("updateStatistic", () => {
  it("should work with empty statistic", async () => {
    const statistic = await updateStatistic({
      answer: {
        input: "answer",
      },
      task: {
        subtype: "input",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
        },
        evaluation: {
          pattern: "answer",
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          patterns: [],
        },
      },
    });

    const expected: IStatistic = {
      count: 1,
      inputs: {
        answer: {
          correct: true,
          count: 1,
        },
      },
      patterns: {},
    };

    expect(statistic).toEqual(expected);
  });

  it("should work with precalculated statistic", async () => {
    const statistic = await updateStatistic({
      statistic: {
        count: 43,
        inputs: {
          hallo: {
            count: 1,
            correct: true,
          },
          answer: { count: 1, correct: false },
        },
        patterns: {},
      },
      answer: {
        input: "hallo",
      },
      task: {
        subtype: "input",
        description: "desc",
        name: "name",
        view: {
          instruction: "An instruction",
        },
        evaluation: {
          pattern: "answer",
          enableRetry: false,
          mode: "auto",
          showFeedback: false,
        },
        feedback: {
          patterns: [],
        },
      },
    });

    const expected: IStatistic = {
      count: 44,
      inputs: {
        hallo: {
          count: 2,
          correct: false,
        },
        answer: { count: 1, correct: false },
      },
      patterns: {},
    };

    expect(statistic).toEqual(expected);
  });
});
