import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { allCorrect, evaluate, itemStates, scoreOf } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const line = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    min: -2,
    max: 2,
    tickStep: 1,
    items: [
      { id: "half", label: "1/2", value: 0.5 },
      { id: "quarter", label: "-3/4", value: -0.75 },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("DataSchema", () => {
  it("fills in the documented defaults", () => {
    const data = line();
    expect(data.minorTicks).toBe(0);
    expect(data.labelTicks).toBe(true);
    expect(data.snap).toBe("minor");
    expect(data.partialCredit).toBe(true);
    expect(data.tolerance).toBeUndefined();
  });

  it("refuses a maximum no greater than the minimum", () => {
    expect(DataSchema.safeParse({ ...line(), min: 2, max: 2 }).success).toBe(false);
  });

  it("refuses a value outside the line", () => {
    const result = DataSchema.safeParse({
      ...line(),
      items: [...line().items, { id: "far", label: "far", value: 9 }],
    });
    expect(result.success).toBe(false);
  });

  it("refuses two items with the same id", () => {
    const result = DataSchema.safeParse({
      ...line(),
      items: [
        { id: "x", label: "a", value: 0 },
        { id: "x", label: "b", value: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("wants at least one item", () => {
    expect(DataSchema.safeParse({ ...line(), items: [] }).success).toBe(false);
  });

  it("refuses a negative tolerance", () => {
    expect(DataSchema.safeParse({ ...line(), tolerance: -1 }).success).toBe(false);
  });

  it("refuses a tick step that would draw too many ticks", () => {
    expect(DataSchema.safeParse({ ...line(), min: 0, max: 100, tickStep: 1 }).success).toBe(
      false,
    );
  });
});

describe("itemStates", () => {
  it("falls back to a quarter of the tick spacing with no tolerance set", () => {
    // tickStep 1 → tolerance 0.25; 0.5 placed at 0.7 is 0.2 off, within it.
    const states = itemStates(line(), { positions: { half: 0.7, quarter: -0.75 } });
    expect(states).toEqual({ half: "correct", quarter: "correct" });
  });

  it("marks a placement past the tolerance wrong", () => {
    const states = itemStates(line(), { positions: { half: 0.9, quarter: -0.75 } });
    expect(states.half).toBe("wrong");
  });

  it("an item's own tolerance overrides the line's", () => {
    const data = line({
      items: [{ id: "root", label: "√2", value: Math.SQRT2, tolerance: 0.5 }],
    });
    // 0.4 off the true value, which the line's own tolerance (0.25) would fail.
    const states = itemStates(data, { positions: { root: Math.SQRT2 + 0.4 } });
    expect(states.root).toBe("correct");
  });

  it("counts an unplaced item as wrong", () => {
    const states = itemStates(line(), { positions: { half: 0.5 } });
    expect(states.quarter).toBe("wrong");
  });

  it("counts a missing answer entirely as every item wrong", () => {
    const states = itemStates(line(), undefined);
    expect(Object.values(states).every((state) => state === "wrong")).toBe(true);
  });
});

describe("scoreOf / allCorrect", () => {
  it("gives a point per item with partial credit", () => {
    const score = scoreOf(line(), { positions: { half: 0.5, quarter: 0 } });
    expect(score).toEqual({ earned: 1, possible: 2 });
  });

  it("is correct only when every item is", () => {
    expect(allCorrect(line(), { positions: { half: 0.5, quarter: -0.75 } })).toBe(true);
    expect(allCorrect(line(), { positions: { half: 0.5, quarter: 0 } })).toBe(false);
  });
});

describe("evaluate", () => {
  it("scores with partial credit by default", () => {
    const result = evaluate({ data: line(), answer: { positions: { half: 0.5, quarter: 0 } } });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("is worth one point all-or-nothing when partial credit is off", () => {
    const data = line({ partialCredit: false });
    const partial = evaluate({ data, answer: { positions: { half: 0.5, quarter: 0 } } });
    expect(partial.score).toEqual({ earned: 0, possible: 1 });

    const right = evaluate({
      data,
      answer: { positions: { half: 0.5, quarter: -0.75 } },
    });
    expect(right.score).toEqual({ earned: 1, possible: 1 });
  });

  it("carries per-item states in its detail", () => {
    const result = evaluate({ data: line(), answer: { positions: { half: 0.5, quarter: -0.75 } } });
    expect(result.detail).toEqual({ items: { half: "correct", quarter: "correct" } });
  });

  it("is unknown and never retried when evaluation is skipped", () => {
    const data = line({ evaluation: { ...defaultEvaluation(), mode: "skip" } });
    const result = evaluate({ data, answer: { positions: {} } });
    expect(result.state).toBe("unknown");
    expect(result.allowRetry).toBe(false);
  });
});
