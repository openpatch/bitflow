import { describe, expect, it } from "vitest";
import { evaluate, judge } from "./evaluate";
import { DataSchema, expectedWritten, type Data } from "./schema";

const task = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    sourceRepresentation: "decimal",
    sourceValue: "42",
    targetRepresentation: "binary",
    bitWidth: 8,
    ...over,
  });

const raw = (value: string) => ({ raw: value });

describe("judge", () => {
  it("accepts the value however it is spelled", () => {
    // Marked arithmetically: the same value written another acceptable way is
    // the same answer, and no list of spellings is kept anywhere.
    expect(judge(task(), raw("00101010")).correct).toBe(true);
    expect(judge(task(), raw("0b00101010")).correct).toBe(true);
    expect(judge(task(), raw(" 00101010 ")).correct).toBe(true);
  });

  it("does not care about the case of a hex digit", () => {
    const hex = task({ targetRepresentation: "hex" });
    expect(judge(hex, raw("2a")).correct).toBe(true);
    expect(judge(hex, raw("2A")).correct).toBe(true);
  });

  it("says when the answer is a value, but the wrong one", () => {
    expect(judge(task(), raw("00101011")).reason).toBe("wrongValue");
  });

  it("says which kind of nonsense it is", () => {
    expect(judge(task(), raw("")).reason).toBe("empty");
    expect(judge(task(), raw("00102010")).reason).toBe("badDigit");
    expect(judge(task(), raw("101010")).reason).toBe("notFullWidth");
    expect(judge(task(), raw("100101010")).reason).toBe("tooWide");
    expect(judge(task({ signed: true }), raw("-101010")).reason).toBe("negative");
  });

  it("marks two's complement as two's complement", () => {
    const signed = task({ sourceValue: "-42", signed: true });

    expect(expectedWritten(signed)).toBe("11010110");
    expect(judge(signed, raw("11010110")).correct).toBe(true);
    expect(judge(signed, raw("10101010")).reason).toBe("wrongValue");
  });

  it("marks a byte at a time when the value is text", () => {
    const ascii = task({
      sourceRepresentation: "text",
      sourceValue: "HI",
      targetRepresentation: "binary",
    });

    expect(judge(ascii, raw("01001000 01001001")).correct).toBe(true);
    expect(judge(ascii, raw("01001000")).reason).toBe("wrongValue");
  });

  it("marks the other way round too", () => {
    const back = task({
      sourceRepresentation: "binary",
      sourceValue: "01001000 01001001",
      targetRepresentation: "text",
    });

    expect(judge(back, raw("HI")).correct).toBe(true);
    expect(judge(back, raw("hi")).reason).toBe("wrongValue");
  });
});

describe("evaluate", () => {
  it("scores one for the value", () => {
    expect(evaluate({ data: task(), answer: raw("00101010") })).toMatchObject({
      state: "correct",
      score: { earned: 1, possible: 1 },
      detail: { reason: "correct" },
    });
  });

  it("scores a mark per digit in the right place when asked to", () => {
    const digits = task({ scoring: "digits" });

    // 00101010 against 00101011: seven of the eight digits are where they
    // should be.
    expect(evaluate({ data: digits, answer: raw("00101011") }).score).toEqual({
      earned: 7,
      possible: 8,
    });
  });

  it("is worth the same whether or not it can be read at all", () => {
    // What an item is worth must not depend on how badly it was answered.
    const digits = task({ scoring: "digits" });
    expect(evaluate({ data: digits, answer: raw("nonsense") }).score).toEqual({
      earned: 0,
      possible: 8,
    });
  });

  it("returns unknown when the task is not graded", () => {
    expect(
      evaluate({
        data: task({ evaluation: { mode: "skip" } }),
        answer: raw("00101010"),
      }),
    ).toEqual({ state: "unknown", allowRetry: false });
  });

  it("evaluates without a network request of any kind", () => {
    const original = globalThis.fetch;
    const calls: unknown[] = [];
    globalThis.fetch = ((...args: unknown[]) => {
      calls.push(args);
      throw new Error("no");
    }) as typeof fetch;

    try {
      expect(evaluate({ data: task(), answer: raw("00101010") }).state).toBe("correct");
      expect(calls).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
