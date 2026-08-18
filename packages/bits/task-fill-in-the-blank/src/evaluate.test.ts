import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { blankIdsIn, DataSchema, type Data } from "./schema";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({
    text: "The capital of France is [[1]] and of Italy is [[2]].",
    blanks: { "1": ["Paris"], "2": ["Rome", "Roma"] },
    ...overrides,
  });

describe("blankIdsIn", () => {
  it("finds the blanks in order", () => {
    expect(blankIdsIn("a [[1]] b [[2]] c")).toEqual(["1", "2"]);
  });

  it("lists a repeated blank once", () => {
    expect(blankIdsIn("[[1]] and [[1]]")).toEqual(["1"]);
  });

  it("finds none in plain text", () => {
    expect(blankIdsIn("nothing here")).toEqual([]);
  });
});

describe("evaluate", () => {
  it("is correct when every blank matches", () => {
    const result = evaluate({
      data: data(),
      answer: { blanks: { "1": "Paris", "2": "Rome" } },
    });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("accepts any of a blank's alternatives", () => {
    expect(
      evaluate({ data: data(), answer: { blanks: { "1": "Paris", "2": "Roma" } } }).state,
    ).toBe("correct");
  });

  it("reports which blanks were right", () => {
    const result = evaluate({
      data: data(),
      answer: { blanks: { "1": "Paris", "2": "Milan" } },
    });
    expect(result.detail?.blanks).toEqual({ "1": "correct", "2": "wrong" });
    expect(result.state).toBe("wrong");
  });

  it("gives partial credit per blank by default", () => {
    const result = evaluate({
      data: data(),
      answer: { blanks: { "1": "Paris", "2": "Milan" } },
    });
    expect(result.score).toEqual({ earned: 0.5, possible: 1 });
  });

  it("scores all or nothing when partial credit is off", () => {
    const result = evaluate({
      data: data({ partialCredit: false }),
      answer: { blanks: { "1": "Paris", "2": "Milan" } },
    });
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("ignores capitalisation and surrounding spaces by default", () => {
    expect(
      evaluate({ data: data(), answer: { blanks: { "1": " paris ", "2": "ROME" } } }).state,
    ).toBe("correct");
  });

  it("honours case sensitivity when asked", () => {
    expect(
      evaluate({
        data: data({ caseSensitive: true }),
        answer: { blanks: { "1": "paris", "2": "Rome" } },
      }).detail?.blanks,
    ).toEqual({ "1": "wrong", "2": "correct" });
  });

  it("counts an unanswered blank as wrong", () => {
    const result = evaluate({ data: data(), answer: { blanks: { "1": "Paris" } } });
    expect(result.detail?.blanks).toEqual({ "1": "correct", "2": "wrong" });
  });

  it("respects the grading mode", () => {
    expect(
      evaluate({
        data: data({ evaluation: { ...defaultEvaluation(), mode: "skip", enableRetry: false, showFeedback: true } }),
        answer: { blanks: {} },
      }).state,
    ).toBe("unknown");
  });
});

describe("DataSchema", () => {
  it("rejects a graded text with no blanks", () => {
    const parsed = DataSchema.safeParse({ text: "no gaps here", blanks: {} });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].path).toEqual(["text"]);
  });

  it("rejects a blank with no accepted answer", () => {
    const parsed = DataSchema.safeParse({ text: "a [[1]] b", blanks: { "1": [] } });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].path).toEqual(["blanks", "1"]);
  });
});
