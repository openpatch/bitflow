import { evaluate } from "../src/evaluate";
import { IAnswer, IEvaluation, IFeedback, ITask } from "../src/types";

const answer: IAnswer = {
  checked: {
    a: true,
    b: true,
    c: false,
  },
};
const task: ITask = {
  title: "Title",
  instruction: "Instruction",
  variant: "multiple",
  choices: [
    {
      markdown: "A",
    },
    {
      markdown: "B",
    },
    {
      markdown: "C",
    },
    {
      markdown: "D",
    },
  ],
};

const evaluation: IEvaluation = {
  correct: ["a", "b"],
  enableRetry: false,
  showFeedback: false,
  mode: "auto",
};
const feedback: IFeedback = {
  choices: {},
  patterns: {
    ab: { message: "Feedback AB", severity: "error" },
  },
};

describe("evaluate", () => {
  it("should succeed", async () => {
    const result = await evaluate({ task, evaluation, answer });

    expect(result.state).toBe("correct");
  });

  it("should give feedback", async () => {
    const result = await evaluate({
      task,
      evaluation: {
        mode: "auto",
        correct: ["a"],
        showFeedback: true,
        enableRetry: false,
      },
      feedback,
      answer,
    });

    expect(result?.feedback?.message).toBe(feedback.patterns.ab.message);
    expect(result?.feedback?.severity).toBe(feedback.patterns.ab.severity);
  });

  it("should skip evaluation", async () => {
    const result = await evaluate({
      task,
      evaluation: { mode: "skip", enableRetry: false, showFeedback: false },
      answer,
    });

    expect(result.state).toBe("unknown");
    expect(result.feedback).toBeUndefined();
    expect(result.choices).toEqual({});
  });

  it("should allow retry", async () => {
    const result = await evaluate({
      task,
      evaluation: {
        mode: "auto",
        enableRetry: true,
        showFeedback: false,
        correct: ["a"],
      },
      feedback,
      answer,
    });

    expect(result.state).toBe("wrong");
    expect(result.allowRetry).toBeTruthy();
  });

  it("should manually evaluate", () => {});
});
