import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import {
  acceptedRange,
  evaluate,
  read,
  roundToSignificant,
  unitAccepted,
  withinTolerance,
} from "./evaluate";
import { DataSchema, type Data } from "./schema";

const make = (changes: Partial<Data> = {}): Data =>
  DataSchema.parse({ expected: "0.75", ...changes });

const mark = (data: Data, input: string) => evaluate({ data, answer: { input } });

describe("evaluate", () => {
  it("marks on the value rather than on the characters", () => {
    const data = make();
    for (const input of ["0.75", ".75", "3/4", "75e-2", " 0.750 "]) {
      expect(mark(data, input).state, input).toBe("correct");
    }
    expect(mark(data, "0.76").state).toBe("wrong");
  });

  it("scores nothing out of one for an answer it cannot read", () => {
    const result = mark(make(), "about three quarters");
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 1 });
    expect(result.detail?.error).toBe("syntax");
  });

  it("is wrong, not blank, for no answer at all", () => {
    expect(evaluate({ data: make(), answer: undefined }).state).toBe("wrong");
  });

  it("carries the reading it marked on, beside the raw text", () => {
    const result = mark(make(), "3/4");
    // Both halves: what was typed settles what the learner did, and what it
    // was taken to mean settles whether the mark was fair.
    expect(result.detail).toMatchObject({
      input: "3/4",
      value: 0.75,
      expected: 0.75,
      valueCorrect: true,
    });
  });

  it("returns unknown when grading is switched off", () => {
    const data = make({ evaluation: { ...defaultEvaluation(), mode: "skip" } });
    expect(evaluate({ data, answer: { input: "nonsense" } })).toEqual({
      state: "unknown",
      allowRetry: false,
    });
  });

  it("never asks anything outside itself", () => {
    // No fetch, no timers, no globals: the whole decision is the two
    // arguments. Anything else would break offline and break replay.
    const fetchBefore = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("evaluate must not make a request");
    }) as typeof fetch;
    expect(mark(make(), "0.75").state).toBe("correct");
    globalThis.fetch = fetchBefore;
  });
});

describe("tolerance", () => {
  it("forgives floating-point noise even when told to be exact", () => {
    const data = make({ expected: "0.3" });
    // 0.1 + 0.2 is 0.30000000000000004, and marking that wrong would be
    // teaching binary representation, not arithmetic.
    expect(mark(data, "0.1+0.2").state).toBe("correct");
  });

  it("accepts a fixed distance either side", () => {
    const data = make({ expected: "100", tolerance: "absolute", toleranceValue: 2 });
    expect(mark(data, "98").state).toBe("correct");
    expect(mark(data, "102").state).toBe("correct");
    expect(mark(data, "97.9").state).toBe("wrong");
    expect(acceptedRange(100, data)).toEqual({ from: 98, to: 102 });
  });

  it("accepts a percentage of the expected value", () => {
    const data = make({ expected: "200", tolerance: "percent", toleranceValue: 5 });
    expect(mark(data, "190").state).toBe("correct");
    expect(mark(data, "210").state).toBe("correct");
    expect(mark(data, "189").state).toBe("wrong");
  });

  it("falls back to exact when a percentage is taken of zero", () => {
    const data = make({ expected: "0", tolerance: "percent", toleranceValue: 5 });
    expect(mark(data, "0").state).toBe("correct");
    expect(mark(data, "0.1").state).toBe("wrong");
  });

  it("compares to a number of decimal places", () => {
    const data = make({ expected: "3.14159", tolerance: "decimals", digits: 2 });
    expect(mark(data, "3.14").state).toBe("correct");
    expect(mark(data, "3.1416").state).toBe("correct");
    expect(mark(data, "3.1").state).toBe("wrong");
  });

  it("compares to a number of significant figures", () => {
    const data = make({ expected: "0.00123456", tolerance: "significant", digits: 3 });
    expect(mark(data, "0.00123").state).toBe("correct");
    expect(mark(data, "0.001235").state).toBe("correct");
    expect(mark(data, "0.00124").state).toBe("wrong");

    // The figures are counted from the first one that is not a zero, which is
    // the whole point of the rule.
    expect(roundToSignificant(0.00123456, 3)).toBeCloseTo(0.00123, 10);
    expect(roundToSignificant(123456, 3)).toBe(123000);
  });

  it("keeps working at magnitudes a fixed tolerance could not span", () => {
    const tiny = make({ expected: "6.62607e-34", tolerance: "percent", toleranceValue: 1 });
    expect(mark(tiny, "6.626e-34").state).toBe("correct");
    expect(withinTolerance(6.626e-34, 6.62607e-34, tiny)).toBe(true);
  });
});

describe("units", () => {
  const shown = make({ expected: "9.81", unitMode: "shown", unit: "m/s^2" });
  const required = make({
    expected: "9.81",
    unitMode: "required",
    unit: "m/s^2",
    unitAlternatives: ["m/s²", "N/kg"],
  });

  it("does not require what it prints beside the box", () => {
    expect(mark(shown, "9.81").state).toBe("correct");
    // Typing it anyway is not a mistake.
    expect(mark(shown, "9.81 m/s^2").state).toBe("correct");
  });

  it("still refuses a wrong unit that was volunteered", () => {
    expect(mark(shown, "9.81 m/s").state).toBe("wrong");
  });

  it("requires one when the learner is the one who has to know it", () => {
    expect(mark(required, "9.81").state).toBe("wrong");
    expect(mark(required, "9.81 m/s^2").state).toBe("correct");
    expect(mark(required, "9.81 m/s²").state).toBe("correct");
    expect(mark(required, "9.81 N/kg").state).toBe("correct");
  });

  it("refuses anything trailing when there is no unit at all", () => {
    expect(mark(make(), "0.75 kg").state).toBe("wrong");
    expect(unitAccepted(make(), "kg")).toBe(false);
  });

  it("gives the unit its own mark when the author asks for one", () => {
    const data = make({ ...required, scoring: "valueAndUnit" });
    expect(mark(data, "9.81 m/s^2").score).toEqual({ earned: 2, possible: 2 });
    // The number is right and the unit is not: that is half the answer, and
    // scoring it as nothing would say the arithmetic was wrong too.
    expect(mark(data, "9.81 m/s").score).toEqual({ earned: 1, possible: 2 });
    expect(mark(data, "9.8 m/s^2").score).toEqual({ earned: 1, possible: 2 });
    expect(mark(data, "9.81 m/s").state).toBe("wrong");
  });
});

describe("decimal separators and expressions", () => {
  it("reads a comma as a decimal point by default", () => {
    expect(mark(make(), "0,75").state).toBe("correct");
  });

  it("can be held to one separator", () => {
    const point = make({ decimalSeparator: "point" });
    expect(mark(point, "0.75").state).toBe("correct");
    expect(mark(point, "0,75").state).toBe("wrong");
  });

  it("can refuse a calculation, which is the question when it is one", () => {
    const data = make({ allowExpression: false });
    expect(mark(data, "0.75").state).toBe("correct");
    expect(mark(data, "3/4").state).toBe("wrong");
    expect(mark(data, "3/4").detail?.error).toBe("expressionNotAllowed");
  });
});

describe("feedback for particular answers", () => {
  const data = make({
    expected: "9.81",
    tolerance: "absolute",
    toleranceValue: 0.05,
    valueFeedback: [
      { value: "9.81*2", feedback: { message: "You doubled it.", severity: "info" } },
      { value: "0.981", feedback: { message: "Out by ten.", severity: "info" } },
    ],
  });

  it("matches with the same tolerance as the answer itself", () => {
    expect(mark(data, "19.62").feedback).toEqual([
      { message: "You doubled it.", severity: "info" },
    ]);
    expect(mark(data, "0.98").feedback).toEqual([
      { message: "Out by ten.", severity: "info" },
    ]);
    expect(mark(data, "9.81").feedback).toBeUndefined();
  });

  it("stays quiet when the author turned feedback off", () => {
    const quiet = { ...data, evaluation: { ...defaultEvaluation(), showFeedback: false } };
    expect(mark(quiet, "19.62").feedback).toBeUndefined();
  });
});

describe("read", () => {
  it("is the same reading the learner is shown and the score is worked from", () => {
    const data = make({ expected: "0.75" });
    const live = read(data, "3/4");
    const marked = mark(data, "3/4");
    expect(live.value).toBe(marked.detail?.value);
    expect(live.valueCorrect).toBe(marked.detail?.valueCorrect);
  });
});
