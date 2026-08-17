import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Capital of France?",
    matchMode: "exact",
    expected: ["Paris"],
    ...overrides,
  });

describe("evaluate", () => {
  describe("exact", () => {
    it("accepts the expected answer", () => {
      expect(evaluate({ data: data(), answer: { input: "Paris" } }).state).toBe("correct");
    });

    it("ignores capitalisation unless asked not to", () => {
      expect(evaluate({ data: data(), answer: { input: "paris" } }).state).toBe("correct");
      expect(
        evaluate({
          data: data({ caseSensitive: true }),
          answer: { input: "paris" },
        }).state,
      ).toBe("wrong");
    });

    it("ignores surrounding spaces unless asked not to", () => {
      expect(evaluate({ data: data(), answer: { input: "  Paris " } }).state).toBe("correct");
      expect(
        evaluate({ data: data({ trim: false }), answer: { input: " Paris" } }).state,
      ).toBe("wrong");
    });

    it("accepts any of several answers", () => {
      const many = data({ expected: ["Paris", "Paname"] });
      expect(evaluate({ data: many, answer: { input: "Paname" } }).state).toBe("correct");
    });

    it("ignores blank lines among the accepted answers", () => {
      const withBlank = data({ expected: ["Paris", "", "  "] });
      expect(evaluate({ data: withBlank, answer: { input: "" } }).state).toBe("wrong");
    });

    it("rejects a near miss", () => {
      expect(evaluate({ data: data(), answer: { input: "Marseille" } }).state).toBe("wrong");
    });
  });

  describe("contains", () => {
    it("accepts an answer containing the expected text", () => {
      const contains = data({ matchMode: "contains", expected: ["prime"] });
      expect(
        evaluate({ data: contains, answer: { input: "it is a prime number" } }).state,
      ).toBe("correct");
    });
  });

  describe("regex", () => {
    const regex = data({ matchMode: "regex", pattern: "^\\d{4}$", expected: [] });

    it("accepts an answer matching the pattern", () => {
      expect(evaluate({ data: regex, answer: { input: "1789" } }).state).toBe("correct");
    });

    it("rejects one that does not", () => {
      expect(evaluate({ data: regex, answer: { input: "89" } }).state).toBe("wrong");
    });

    it("treats an uncompilable pattern as no match instead of throwing", () => {
      // The schema refuses to save this, so it can only arrive by hand-editing.
      const broken = { ...regex, pattern: "([" };
      expect(() => evaluate({ data: broken, answer: { input: "x" } })).not.toThrow();
      expect(evaluate({ data: broken, answer: { input: "x" } }).state).toBe("wrong");
    });
  });

  it("attaches feedback for a matching pattern", () => {
    const withFeedback = data({
      patternFeedback: [
        { pattern: "lyon", feedback: { message: "Lyon is not the capital.", severity: "info" } },
      ],
    });
    const result = evaluate({ data: withFeedback, answer: { input: "Lyon" } });
    expect(result.feedback?.map((f) => f.message)).toEqual(["Lyon is not the capital."]);
  });
});

describe("DataSchema", () => {
  it("rejects an automatically graded task with no accepted answer", () => {
    const parsed = DataSchema.safeParse({ instruction: "?", matchMode: "exact", expected: [""] });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid regular expression", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      matchMode: "regex",
      pattern: "([",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(["pattern"]);
    }
  });

  it("allows an empty expectation when a teacher grades it", () => {
    const parsed = DataSchema.safeParse({
      instruction: "?",
      matchMode: "exact",
      expected: [],
      evaluation: { mode: "manual", enableRetry: false, showFeedback: true },
    });
    expect(parsed.success).toBe(true);
  });
});
