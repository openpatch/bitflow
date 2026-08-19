import { describe, expect, it } from "vitest";
import { cellCorrect, cellStates, evaluate, normalise, scoreOf } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    code: "let total = 0;\nfor (const v of [1, 2, 3]) total += v;\nprint(total);",
    columns: [
      { id: "i", name: "v", kind: "value" },
      { id: "total", name: "total", kind: "value" },
    ],
    checkpoints: [
      { id: "before", label: "before the loop", expected: { i: "", total: "0" } },
      { id: "after", label: "after the loop", expected: { i: "3", total: "6" } },
    ],
    ...over,
  });

const answer = (cells: Record<string, Record<string, string>>): Answer => ({ cells });

const right = answer({
  before: { i: "", total: "0" },
  after: { i: "3", total: "6" },
});

describe("normalise", () => {
  it("drops spaces around punctuation but keeps them inside a value", () => {
    expect(normalise("[1, 2]", true)).toBe("[1,2]");
    expect(normalise("hello world", true)).toBe("hello world");
  });

  it("lowercases unless the author asked otherwise", () => {
    expect(normalise("True", false)).toBe("true");
    expect(normalise("True", true)).toBe("True");
  });
});

describe("cellCorrect", () => {
  it("compares numbers as numbers", () => {
    // A trace is a claim about a value, not about how it is spelled.
    expect(cellCorrect("6", "6.0", false)).toBe(true);
    expect(cellCorrect("6", "+6", false)).toBe(true);
    expect(cellCorrect("6", "7", false)).toBe(false);
  });

  it("does not read a hex literal as a number", () => {
    // `Number("0x10")` is 16, which would quietly mark a wrong answer right.
    expect(cellCorrect("16", "0x10", false)).toBe(false);
  });

  it("does not read an empty cell as zero", () => {
    expect(cellCorrect("0", "", false)).toBe(false);
    expect(cellCorrect("", "", false)).toBe(true);
  });

  it("ignores capital letters by default", () => {
    expect(cellCorrect("True", "true", false)).toBe(true);
    expect(cellCorrect("True", "true", true)).toBe(false);
  });

  it("treats a list written either way as one answer", () => {
    expect(cellCorrect("[1, 2, 3]", "[1,2,3]", false)).toBe(true);
  });
});

describe("evaluate", () => {
  it("marks a complete trace correct", () => {
    const result = evaluate({ data: data(), answer: right });

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 3, possible: 3 });
  });

  it("gives a point per cell", () => {
    const result = evaluate({
      data: data(),
      answer: answer({ before: { total: "0" }, after: { i: "3", total: "21" } }),
    });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 2, possible: 3 });
  });

  it("scores all or nothing when the author says so", () => {
    const result = evaluate({
      data: data({ partialCredit: false }),
      answer: answer({ before: { total: "0" }, after: { i: "3", total: "21" } }),
    });

    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("pays nothing for an empty table", () => {
    // The cells the author left blank are part of the trace but not marks to
    // be earned, or a table of undefined variables would pay for silence.
    const result = evaluate({ data: data(), answer: answer({}) });

    expect(result.score).toEqual({ earned: 0, possible: 3 });
  });

  it("still counts a value written where none belongs as wrong", () => {
    const result = evaluate({
      data: data(),
      answer: answer({
        before: { i: "0", total: "0" },
        after: { i: "3", total: "6" },
      }),
    });

    expect(result.state).toBe("wrong");
    // Nothing is taken away for it; the mistake is shown rather than charged.
    expect(result.score).toEqual({ earned: 3, possible: 3 });
    expect(cellStates(data(), answer({ before: { i: "0" } })).before.i).toBe("wrong");
  });

  it("reports the state of every cell", () => {
    const states = cellStates(data(), right);

    expect(states).toEqual({
      before: { i: "correct", total: "correct" },
      after: { i: "correct", total: "correct" },
    });
  });

  it("returns unknown when the task is not graded", () => {
    const result = evaluate({
      data: data({ evaluation: { mode: "skip" } }),
      answer: right,
    });

    expect(result).toEqual({ state: "unknown", allowRetry: false });
  });

  it("counts only the cells with something in them", () => {
    expect(scoreOf(data(), right).possible).toBe(3);
  });

  it("evaluates without a network request of any kind", () => {
    // The answer key is in the authored data. Nothing here can reach out, and
    // the code is a string that is never handed to an interpreter.
    const fetched: unknown[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((...args: unknown[]) => {
      fetched.push(args);
      throw new Error("no");
    }) as typeof fetch;

    try {
      expect(evaluate({ data: data(), answer: right }).state).toBe("correct");
      expect(fetched).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
