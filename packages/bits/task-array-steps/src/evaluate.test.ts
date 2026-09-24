import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, rowCorrect, stepStates, trimTrailingBlanks } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const bubble = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    initial: ["5", "2", "8", "1"],
    steps: [
      { id: "p1", label: "After pass 1", expected: ["2", "5", "1", "8"] },
      { id: "p2", label: "After pass 2", expected: ["2", "1", "5", "8"] },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("rowCorrect", () => {
  it("ignores case unless asked not to", () => {
    expect(rowCorrect(["A", "b"], ["a", "B"], false)).toBe(true);
    expect(rowCorrect(["A", "b"], ["a", "B"], true)).toBe(false);
  });

  it("does not count the blanks a shrunk stack leaves at the end", () => {
    expect(rowCorrect(["4", "2"], ["4", "2", "", " "], false)).toBe(true);
    expect(trimTrailingBlanks(["", "3", ""])).toEqual(["", "3"]);
  });

  it("still counts a blank in the middle", () => {
    expect(rowCorrect(["4", "2"], ["4", "", "2"], false)).toBe(false);
  });
});

describe("stepStates", () => {
  it("judges an untouched step by what was carried forward to it", () => {
    const data = bubble();
    // Only the first pass is written; the second still shows the first's row.
    const states = stepStates(data, { rows: [["2", "5", "1", "8"]] });
    expect(states.map((state) => state.state)).toEqual(["correct", "wrong"]);
    expect(states[1].diffs).toEqual([false, true, true, false]);
  });
});

describe("evaluate", () => {
  it("gives a point per right step with partial credit", () => {
    const result = evaluate({
      data: bubble(),
      answer: { rows: [["2", "5", "1", "8"], ["2", "5", "1", "8"]] },
    });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("is all or nothing without partial credit", () => {
    const result = evaluate({
      data: bubble({ partialCredit: false }),
      answer: { rows: [["2", "5", "1", "8"], ["2", "5", "1", "8"]] },
    });
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("is correct when every step is", () => {
    const result = evaluate({
      data: bubble(),
      answer: { rows: [["2", "5", "1", "8"], ["2", "1", "5", "8"]] },
    });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 2, possible: 2 });
  });

  it("marks nothing when the author skips evaluation", () => {
    const data = bubble();
    const result = evaluate({
      data: { ...data, evaluation: { ...data.evaluation, mode: "skip" } },
    });
    expect(result.state).toBe("unknown");
  });
});
