import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Which are prime?",
    variant: "multiple",
    choices: [
      { id: "a", markdown: "2", correct: true },
      { id: "b", markdown: "3", correct: true },
      { id: "c", markdown: "4", correct: false },
    ],
    ...overrides,
  });

describe("evaluate", () => {
  it("is correct when the selection matches exactly", () => {
    const result = evaluate({ data: data(), answer: { selected: ["a", "b"] } });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("is wrong when a correct choice is missing", () => {
    const result = evaluate({ data: data(), answer: { selected: ["a"] } });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("is wrong when an incorrect choice is ticked as well", () => {
    const result = evaluate({
      data: data(),
      answer: { selected: ["a", "b", "c"] },
    });
    expect(result.state).toBe("wrong");
  });

  it("is wrong for no answer at all", () => {
    expect(evaluate({ data: data() }).state).toBe("wrong");
  });

  it("reports the state of every choice", () => {
    const result = evaluate({ data: data(), answer: { selected: ["a", "c"] } });
    expect(result.detail?.choices).toEqual({
      a: "correct", // ticked, and it should be
      b: "wrong", // not ticked, but it should have been
      c: "wrong", // ticked, but it should not have been
    });
  });

  describe("partial credit", () => {
    it("scores each choice separately when enabled", () => {
      const result = evaluate({
        data: data({ partialCredit: true }),
        answer: { selected: ["a"] },
      });
      // a and c are right (ticked correctly / left correctly), b is not.
      expect(result.score).toEqual({ earned: 2 / 3, possible: 1 });
      expect(result.state).toBe("wrong");
    });

    it("still awards the full point for a perfect answer", () => {
      const result = evaluate({
        data: data({ partialCredit: true }),
        answer: { selected: ["a", "b"] },
      });
      expect(result.score).toEqual({ earned: 1, possible: 1 });
    });
  });

  describe("evaluation modes", () => {
    it("never grades a skipped task", () => {
      const result = evaluate({
        data: data({
          evaluation: { mode: "skip", enableRetry: false, showFeedback: true },
        }),
        answer: { selected: ["a", "b"] },
      });
      expect(result.state).toBe("unknown");
    });

    it("leaves an ungraded task out of the score entirely", () => {
      const result = evaluate({
        data: data({
          evaluation: { mode: "skip", enableRetry: false, showFeedback: true },
        }),
        answer: { selected: [] },
      });
      expect(result.state).toBe("unknown");
      expect(result.score).toBeUndefined();
    });

    it("passes the retry setting through to the result", () => {
      const result = evaluate({
        data: data({
          evaluation: { mode: "auto", enableRetry: true, showFeedback: true },
        }),
        answer: { selected: [] },
      });
      expect(result.allowRetry).toBe(true);
    });
  });

  describe("feedback", () => {
    const withFeedback = data({
      choices: [
        {
          id: "a",
          markdown: "2",
          correct: true,
          feedbackWhenNotChecked: { message: "2 is prime.", severity: "info" },
        },
        {
          id: "b",
          markdown: "3",
          correct: true,
        },
        {
          id: "c",
          markdown: "4",
          correct: false,
          feedbackWhenChecked: { message: "4 = 2 × 2.", severity: "warning" },
        },
      ],
      patternFeedback: [
        {
          choiceIds: ["c"],
          feedback: { message: "You picked only even numbers.", severity: "info" },
        },
      ],
    });

    it("shows per-choice feedback for the branch the learner took", () => {
      const result = evaluate({
        data: withFeedback,
        answer: { selected: ["c"] },
      });
      const messages = result.feedback?.map((f) => f.message) ?? [];
      expect(messages).toContain("2 is prime."); // a was left unticked
      expect(messages).toContain("4 = 2 × 2."); // c was ticked
    });

    it("adds feedback matching the exact combination chosen", () => {
      const result = evaluate({
        data: withFeedback,
        answer: { selected: ["c"] },
      });
      expect(result.feedback?.map((f) => f.message)).toContain(
        "You picked only even numbers.",
      );
    });

    it("does not match a pattern that is only a subset of the answer", () => {
      const result = evaluate({
        data: withFeedback,
        answer: { selected: ["a", "c"] },
      });
      expect(result.feedback?.map((f) => f.message)).not.toContain(
        "You picked only even numbers.",
      );
    });

    it("stays silent when feedback is switched off", () => {
      const result = evaluate({
        data: { ...withFeedback, evaluation: { ...withFeedback.evaluation, showFeedback: false } },
        answer: { selected: ["c"] },
      });
      expect(result.feedback).toBeUndefined();
    });
  });
});

describe("DataSchema", () => {
  it("rejects a single-choice task with two correct answers", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      variant: "single",
      choices: [
        { id: "a", markdown: "1", correct: true },
        { id: "b", markdown: "2", correct: true },
      ],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("single-choice");
      expect(parsed.error.issues[0].path).toEqual(["choices"]);
    }
  });

  it("rejects an automatically graded task with no correct answer", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      variant: "multiple",
      choices: [
        { id: "a", markdown: "1", correct: false },
        { id: "b", markdown: "2", correct: false },
      ],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("at least one choice");
    }
  });

  it("allows no correct answer when the task is not graded", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      variant: "multiple",
      choices: [
        { id: "a", markdown: "1", correct: false },
        { id: "b", markdown: "2", correct: false },
      ],
      evaluation: { mode: "skip", enableRetry: false, showFeedback: true },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects duplicate choice ids", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      variant: "multiple",
      choices: [
        { id: "a", markdown: "1", correct: true },
        { id: "a", markdown: "2", correct: false },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects fewer than two choices", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      variant: "single",
      choices: [{ id: "a", markdown: "1", correct: true }],
    });
    expect(parsed.success).toBe(false);
  });
});
