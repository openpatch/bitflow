import { evaluate } from "../src/evaluate";
import { ITask } from "../src/schemas";
import { IAnswer } from "../src/types";

const answer: IAnswer = {
  checked: {
    a: true,
    b: true,
    c: false,
  },
};
const task: ITask = {
  subtype: "choice",
  description: "desc",
  name: "name",
  view: {
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
  },
  evaluation: {
    mode: "auto",
    enableRetry: true,
    showFeedback: false,
    correct: ["a", "b"],
  },
  feedback: {
    choices: {},
    patterns: {
      ab: { message: "Feedback AB", severity: "error" },
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

    expect(result?.feedback?.message).toBe(task.feedback.patterns.ab.message);
    expect(result?.feedback?.severity).toBe(task.feedback.patterns.ab.severity);
  });

  it("should skip evaluation", async () => {
    const result = await evaluate({
      task: {
        ...task,
        evaluation: {
          mode: "skip",
          enableRetry: false,
          showFeedback: false,
          correct: [],
        },
      },
      answer,
    });

    expect(result.state).toBe("unknown");
    expect(result.feedback).toBeUndefined();
    expect(result.choices).toEqual({});
  });

  it("should allow retry", async () => {
    const result = await evaluate({
      task: {
        ...task,
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: false,
          correct: ["a"],
        },
      },
      answer,
    });

    expect(result.state).toBe("wrong");
    expect(result.allowRetry).toBeTruthy();
  });

  it("should manually evaluate", () => {});
});
