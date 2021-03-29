import { evaluate } from "../src/evaluate";
import { ITask } from "../src/schemas";
import { IAnswer } from "../src/types";

const answer: IAnswer = {
  input: "answer",
};
const task: ITask = {
  subtype: "input",
  description: "desc",
  name: "name",
  view: {
    instruction: "Instruction",
  },
  evaluation: {
    mode: "auto",
    enableRetry: true,
    showFeedback: false,
    pattern: "answer",
  },
  feedback: {
    patterns: [
      {
        pattern: "answer",
        feedback: {
          message: "correct",
          severity: "success",
        },
      },
    ],
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
      task.feedback.patterns[0].feedback.message
    );
    expect(result?.feedback?.[0].severity).toBe(
      task.feedback.patterns[0].feedback.severity
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
          pattern: "foo",
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
          pattern: "foo",
        },
      },
      answer,
    });

    expect(result.state).toBe("wrong");
    expect(result.allowRetry).toBeTruthy();
  });

  it("should manually evaluate", () => {});
});
