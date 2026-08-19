import { describe, expect, it } from "vitest";
import { evaluate, judge } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";

/**
 *   A ── 1 ── B
 *   │       ╱ │
 *   4     2   1
 *   │   ╱     │
 *   C ── 5 ── D
 */
const graph = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    weighted: true,
    nodes: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
    ],
    edges: [
      { id: "ab", source: "a", target: "b", weight: 1 },
      { id: "ac", source: "a", target: "c", weight: 4 },
      { id: "bc", source: "b", target: "c", weight: 2 },
      { id: "bd", source: "b", target: "d", weight: 1 },
      { id: "cd", source: "c", target: "d", weight: 5 },
    ],
    sourceId: "a",
    targetId: "d",
    ...over,
  });

const nodes = (...ids: string[]): Answer => ({ nodeIds: ids, edgeIds: [] });
const edges = (...ids: string[]): Answer => ({ nodeIds: [], edgeIds: ids });

describe("a route", () => {
  const data = graph({ goal: "path" });

  it("accepts any joined-up route that arrives", () => {
    expect(judge(data, nodes("a", "c", "d")).correct).toBe(true);
    expect(judge(data, nodes("a", "b", "d")).correct).toBe(true);
  });

  it("says when it starts or finishes in the wrong place", () => {
    expect(judge(data, nodes("b", "d")).reason).toBe("notFromSource");
    expect(judge(data, nodes("a", "b")).reason).toBe("notToTarget");
  });

  it("says when two places in it are not joined", () => {
    expect(judge(data, nodes("a", "d")).reason).toBe("broken");
  });

  it("says when it doubles back on itself", () => {
    expect(judge(data, nodes("a", "b", "c", "b", "d")).reason).toBe("repeats");
  });

  it("says when nothing was chosen", () => {
    expect(judge(data, nodes()).reason).toBe("empty");
  });
});

describe("the cheapest route", () => {
  const data = graph();

  it("takes the cheapest, whichever way it goes", () => {
    expect(judge(data, nodes("a", "b", "d")).correct).toBe(true);
  });

  it("accepts an equally cheap alternative nobody wrote down", () => {
    // A→B→C→D costs 8 and A→C→D costs 9, so neither is cheapest here; the
    // point is that the mark comes from the cost, not from a stored answer.
    const twoWays = graph({
      edges: [
        { id: "ab", source: "a", target: "b", weight: 1 },
        { id: "ac", source: "a", target: "c", weight: 1 },
        { id: "bd", source: "b", target: "d", weight: 1 },
        { id: "cd", source: "c", target: "d", weight: 1 },
      ],
    });

    expect(judge(twoWays, nodes("a", "b", "d")).correct).toBe(true);
    expect(judge(twoWays, nodes("a", "c", "d")).correct).toBe(true);
  });

  it("marks a route that works but costs more", () => {
    expect(judge(data, nodes("a", "c", "d")).reason).toBe("notShortest");
  });

  it("counts connections rather than costs when there are no weights", () => {
    const plain = graph({ weighted: false });
    expect(judge(plain, nodes("a", "b", "d")).correct).toBe(true);
    expect(judge(plain, nodes("a", "b", "c", "d")).reason).toBe("notShortest");
  });
});

describe("a traversal", () => {
  const data = graph({ goal: "traversal", targetId: "" });

  it("wants the whole order", () => {
    expect(judge(data, nodes("a", "b", "c", "d")).correct).toBe(true);
  });

  it("says how much was right before it went wrong", () => {
    const outcome = judge(data, nodes("a", "b", "d", "c"));

    expect(outcome.reason).toBe("wrongOrder");
    expect(outcome.correctPrefix).toBe(2);
    expect(outcome.outOf).toBe(4);
  });

  it("tells stopping early apart from going wrong", () => {
    expect(judge(data, nodes("a", "b")).reason).toBe("missesPlaces");
  });

  it("scores a point per place named in the right order", () => {
    expect(evaluate({ data, answer: nodes("a", "b", "d", "c") }).score).toEqual({
      earned: 2,
      possible: 4,
    });
  });

  it("scores all or nothing when the author says so", () => {
    expect(
      evaluate({
        data: { ...data, partialCredit: false },
        answer: nodes("a", "b", "d", "c"),
      }).score,
    ).toEqual({ earned: 0, possible: 1 });
  });
});

describe("a spanning tree", () => {
  const data = graph({ goal: "spanningTree", sourceId: "", targetId: "" });

  it("takes the cheapest tree", () => {
    expect(judge(data, edges("ab", "bd", "bc")).correct).toBe(true);
  });

  it("marks a tree that joins everything but costs more", () => {
    expect(judge(data, edges("ab", "ac", "bd")).reason).toBe("notCheapestTree");
  });

  it("names the shape that is wrong", () => {
    expect(judge(data, edges("ab", "ac", "bc")).reason).toBe("treeCycle");
    expect(judge(data, edges("ab", "bd")).reason).toBe("treeWrongSize");
  });

  it("ignores places chosen instead of connections", () => {
    // The two lists never both carry an answer; a stray one is not an answer.
    expect(judge(data, nodes("a", "b")).reason).toBe("empty");
  });
});

describe("a cut", () => {
  const data = graph({ goal: "cut" });

  it("takes the near side of any cheapest cut", () => {
    // Cutting A off costs 1 + 4; nothing separates them for less.
    expect(judge(data, nodes("a")).correct).toBe(true);
  });

  it("wants the start on the near side and the finish off it", () => {
    expect(judge(data, nodes("b")).reason).toBe("notSeparating");
    expect(judge(data, nodes("a", "d")).reason).toBe("notSeparating");
  });

  it("marks a separation that costs more than it needs to", () => {
    expect(judge(data, nodes("a", "b")).reason).toBe("notCheapestCut");
  });
});

describe("evaluate", () => {
  it("scores one for anything but a traversal", () => {
    expect(evaluate({ data: graph(), answer: nodes("a", "b", "d") })).toMatchObject({
      state: "correct",
      score: { earned: 1, possible: 1 },
      detail: { reason: "correct" },
    });
  });

  it("returns unknown when the task is not graded", () => {
    expect(
      evaluate({
        data: graph({ evaluation: { mode: "skip" } }),
        answer: nodes("a", "b", "d"),
      }),
    ).toEqual({ state: "unknown", allowRetry: false });
  });

  it("carries the reason so the learner is told what went wrong", () => {
    expect(
      evaluate({ data: graph(), answer: nodes("a", "c", "d") }).detail,
    ).toEqual({ reason: "notShortest" });
  });

  it("evaluates without a network request of any kind", () => {
    // The algorithms run here. There is no answer key to fetch, because the
    // cost of the best answer is computed rather than stored.
    const original = globalThis.fetch;
    const calls: unknown[] = [];
    globalThis.fetch = ((...args: unknown[]) => {
      calls.push(args);
      throw new Error("no");
    }) as typeof fetch;

    try {
      expect(evaluate({ data: graph(), answer: nodes("a", "b", "d") }).state).toBe(
        "correct",
      );
      expect(calls).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
