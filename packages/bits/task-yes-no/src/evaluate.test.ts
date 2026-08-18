import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({ question: "Is 7 prime?", correctAnswer: true, ...overrides });

describe("evaluate", () => {
  it("marks the expected answer correct", () => {
    const result = evaluate({ data: data(), answer: { yes: true } });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("marks the other answer wrong", () => {
    expect(evaluate({ data: data(), answer: { yes: false } }).state).toBe("wrong");
  });

  it("handles a task where 'no' is the right answer", () => {
    const no = data({ correctAnswer: false });
    expect(evaluate({ data: no, answer: { yes: false } }).state).toBe("correct");
    expect(evaluate({ data: no, answer: { yes: true } }).state).toBe("wrong");
  });

  it("counts no answer as wrong rather than unassessed", () => {
    // The learner had two options and picked neither; that is different from
    // skipping, which the flow records separately.
    expect(evaluate({ data: data() }).state).toBe("wrong");
  });

  it("shows the feedback belonging to the answer given", () => {
    const withFeedback = data({
      correctAnswer: false,
      feedbackWhenYes: { message: "7 has no other divisors.", severity: "info" },
      feedbackWhenNo: { message: "Check the definition.", severity: "info" },
    });
    const result = evaluate({ data: withFeedback, answer: { yes: true } });
    expect(result.feedback?.map((f) => f.message)).toEqual([
      "7 has no other divisors.",
    ]);
  });

  it("gives no feedback for a correct answer", () => {
    const withFeedback = data({
      feedbackWhenYes: { message: "nope", severity: "info" },
    });
    expect(evaluate({ data: withFeedback, answer: { yes: true } }).feedback).toBeUndefined();
  });

  it("does not grade a task whose grading is switched off", () => {
    expect(
      evaluate({
        data: data({ evaluation: { ...defaultEvaluation(), mode: "skip", enableRetry: false, showFeedback: true } }),
        answer: { yes: false },
      }).state,
    ).toBe("unknown");
  });
});
