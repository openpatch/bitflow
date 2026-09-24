import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { allCorrect, evaluate, handleKey, handleStates, scoreOf } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const line = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    axes: { x: { min: -4, max: 4, step: 1 }, y: { min: -6, max: 6, step: 1 } },
    target: "2x - 1", // -9, -5, -1, 3, 7 at -4,-2,0,2,4 — but must stay in y range
    handles: [-2, 0, 2],
    tolerance: 0.5,
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("handleKey", () => {
  it("is the x position turned into a string", () => {
    expect(handleKey(2)).toBe("2");
    expect(handleKey(-1.5)).toBe("-1.5");
  });
});

describe("handleStates", () => {
  it("marks a handle within tolerance as correct", () => {
    const data = line();
    // target(0) = -1
    const states = handleStates(data, { values: { [handleKey(0)]: -1 } });
    expect(states["0"]).toBe("correct");
  });

  it("marks a handle outside tolerance as wrong", () => {
    const data = line();
    const states = handleStates(data, { values: { [handleKey(0)]: 0 } });
    expect(states["0"]).toBe("wrong");
  });

  it("accepts a value exactly at the tolerance boundary", () => {
    const data = line({ tolerance: 1 });
    // target(0) = -1; -1 + 1 = 0, exactly on the boundary
    const states = handleStates(data, { values: { [handleKey(0)]: 0 } });
    expect(states["0"]).toBe("correct");
  });

  it("marks a handle with no answer at all as wrong", () => {
    const data = line();
    expect(handleStates(data, undefined)["0"]).toBe("wrong");
    expect(handleStates(data, { values: {} })["0"]).toBe("wrong");
  });
});

describe("scoreOf / allCorrect", () => {
  it("gives a point per handle within tolerance", () => {
    const data = line();
    const score = scoreOf(data, {
      values: { [handleKey(-2)]: -5, [handleKey(0)]: -1, [handleKey(2)]: 0 },
    });
    expect(score).toEqual({ earned: 2, possible: 3 });
  });

  it("is correct only once every handle is", () => {
    const data = line();
    const answer = { values: { [handleKey(-2)]: -5, [handleKey(0)]: -1, [handleKey(2)]: 3 } };
    expect(allCorrect(data, answer)).toBe(true);
    expect(allCorrect(data, { values: { [handleKey(0)]: -1 } })).toBe(false);
  });
});

describe("evaluate", () => {
  it("scores partial credit by default", () => {
    const data = line();
    const result = evaluate({
      data,
      answer: { values: { [handleKey(-2)]: -5, [handleKey(0)]: -1 } },
    });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 2, possible: 3 });
    expect(result.detail).toEqual({
      handles: { "-2": "correct", "0": "correct", "2": "wrong" },
    });
  });

  it("scores all-or-nothing when partial credit is off", () => {
    const data = line({ partialCredit: false });
    const result = evaluate({
      data,
      answer: { values: { [handleKey(-2)]: -5, [handleKey(0)]: -1 } },
    });
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("is correct when every handle is within tolerance", () => {
    const data = line();
    const result = evaluate({
      data,
      answer: { values: { [handleKey(-2)]: -5, [handleKey(0)]: -1, [handleKey(2)]: 3 } },
    });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 3, possible: 3 });
  });

  it("returns unknown without scoring when evaluation is skipped", () => {
    const data = line({ evaluation: { ...defaultEvaluation(), mode: "skip" } });
    const result = evaluate({ data, answer: undefined });
    expect(result.state).toBe("unknown");
    expect(result.score).toBeUndefined();
  });
});
