import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { correctPositions, evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";
import { seededShuffle, shuffledAwayFrom } from "./shuffle";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Put the steps in order.",
    items: [
      { id: "a", kind: "text", label: "Read the input" },
      { id: "b", kind: "text", label: "Sort it" },
      { id: "c", kind: "text", label: "Print the result" },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const score = (order: string[], over: Partial<Data> = {}) =>
  evaluate({ data: data(over), answer: { order } });

describe("correctPositions", () => {
  it("names the items that are home", () => {
    expect(correctPositions(data(), ["a", "c", "b"])).toEqual(["a"]);
  });
});

describe("evaluate", () => {
  it("is correct for the authored order", () => {
    const result = score(["a", "b", "c"]);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 3, possible: 3 });
  });

  it("gives a point for each item in its place", () => {
    // The first is home, the other two are swapped.
    const result = score(["a", "c", "b"]);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 3 });
  });

  it("gives nothing for an order with nothing in place", () => {
    expect(score(["c", "a", "b"]).score).toEqual({ earned: 0, possible: 3 });
  });

  it("says which items are home, so each can be marked where it sits", () => {
    expect(score(["a", "c", "b"]).detail?.correct).toEqual(["a"]);
  });

  it("treats a shifted item as costing every position after it", () => {
    // True of the answer as much as the scoring: moving one item early moves
    // everything else along with it.
    expect(score(["c", "a", "b"]).score?.earned).toBe(0);
  });

  it("survives no answer at all", () => {
    const result = evaluate({ data: data() });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 3 });
  });

  it("does not grade at all when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { ...defaultEvaluation(), mode: "skip" } }),
      answer: { order: ["a", "b", "c"] },
    });

    expect(result.state).toBe("unknown");
  });
});

describe("seededShuffle", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("gives the same order for the same seed", () => {
    // A learner who reloads must not find the items rearranged around what
    // they had already moved.
    expect(seededShuffle(ids, "attempt-1")).toEqual(seededShuffle(ids, "attempt-1"));
  });

  it("gives different learners different orders", () => {
    expect(seededShuffle(ids, "attempt-1")).not.toEqual(
      seededShuffle(ids, "attempt-2"),
    );
  });

  it("keeps every item exactly once", () => {
    expect([...seededShuffle(ids, "x")].sort()).toEqual([...ids].sort());
  });

  it("leaves the original alone", () => {
    const original = [...ids];
    seededShuffle(ids, "x");
    expect(ids).toEqual(original);
  });
});

describe("shuffledAwayFrom", () => {
  const same = (a: string[], b: string[]) => a.join() === b.join();

  it("never deals the answer", () => {
    // A shuffle that happens to be correct hands out a full mark for doing
    // nothing, and reads as a bug to the learner.
    const ids = ["a", "b", "c"];
    for (let seed = 0; seed < 60; seed++) {
      expect(shuffledAwayFrom(ids, `seed-${seed}`, same)).not.toEqual(ids);
    }
  });

  it("still returns something when there is nothing else to deal", () => {
    // One item can only be in one order; giving up eventually beats looping.
    expect(shuffledAwayFrom(["only"], "x", same)).toEqual(["only"]);
  });
});
