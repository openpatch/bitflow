import { evaluate } from "../src/evaluate";
import { ITask } from "../src/schemas";
import { IAnswer } from "../src/types";

const answer: IAnswer = {
  blanks: {
    a: "Hallo",
  },
};
const task: ITask = {
  subtype: "fill-in-the-blank",
  description: "desc",
  name: "name",
  view: {
    instruction: "Instruction",
    textWithBlanks: "",
  },
  evaluation: {
    mode: "auto",
    enableRetry: true,
    showFeedback: false,
    blanks: {
      a: "[hH]allo",
    },
  },
  feedback: {
    blanks: {
      a: {
        patterns: [
          {
            pattern: "[hH]allo",
            feedback: {
              severity: "success",
              message: "Correct",
            },
          },
        ],
      },
    },
  },
};

describe("evaluate", () => {
  it("should succeed", async () => {
    const result = await evaluate({ task, answer });

    expect(result.state).toBe("correct");
  });

  it("should fail with no answer", async () => {
    const result = await evaluate({ task });
    expect(result.state).toBe("wrong");
  });

  it("should give feedback", async () => {
    const result = await evaluate({
      task: {
        ...task,
        evaluation: {
          ...task.evaluation,
          showFeedback: true,
        },
      },
      answer,
    });

    expect(result?.feedback?.[0].message).toBe(
      task.feedback.blanks.a.patterns[0].feedback.message
    );
    expect(result?.feedback?.[0].severity).toBe(
      task.feedback.blanks.a.patterns[0].feedback.severity
    );
  });

  it("should skip evaluation", async () => {
    const result = await evaluate({
      task: {
        ...task,
        evaluation: {
          mode: "skip",
          enableRetry: false,
          showFeedback: false,
          blanks: {},
        },
      },
      answer,
    });

    expect(result.state).toBe("unknown");
    expect(result.feedback).toEqual([]);
  });

  it("should allow retry", async () => {
    const result = await evaluate({
      task: {
        ...task,
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: false,
          blanks: {
            a: "Ciao",
          },
        },
      },
      answer,
    });

    expect(result.state).toBe("wrong");
    expect(result.allowRetry).toBeTruthy();
  });

  it("should manually evaluate", () => {});
});
