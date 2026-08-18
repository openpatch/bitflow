import { beforeEach, describe, expect, it } from "vitest";
import { createAttempt } from "./attempt";
import {
  conditionContext,
  distanceToEnd,
  flowProgress,
  getNode,
  isTerminalNode,
  nextNodeId,
  outgoingEdges,
  startNodeId,
  taskTimeLimit,
  timeSpent,
  timeSpentOn,
} from "./engine";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { AttemptSnapshot } from "./schema";

const linear = doc(
  [
    node("start", "test-start"),
    node("title", "test-content", { text: "Hello" }),
    node("q", "test-task", { correct: "a" }),
    node("end", "test-end"),
  ],
  [edge("start", "title"), edge("title", "q"), edge("q", "end")],
);

const snapshotOf = (document = linear): AttemptSnapshot => {
  const created = createAttempt(document);
  if (!created.ok) throw new Error(created.error.message);
  return created.value;
};

describe("engine", () => {
  beforeEach(registerTestBits);

  it("starts at the registered start bit", () => {
    expect(startNodeId(linear)).toBe("start");
  });

  it("falls back to the node nothing points at when no start bit is loaded", () => {
    const orphaned = doc(
      [node("a", "unregistered"), node("b", "unregistered")],
      [edge("a", "b")],
    );
    expect(startNodeId(orphaned)).toBe("a");
  });

  it("walks a linear flow and stops at the end bit", () => {
    const context = conditionContext(snapshotOf());
    expect(nextNodeId(linear, "start", context)).toBe("title");
    expect(nextNodeId(linear, "title", context)).toBe("q");
    expect(nextNodeId(linear, "q", context)).toBe("end");
    expect(nextNodeId(linear, "end", context)).toBeNull();
  });

  it("treats an end bit as terminal even when edges leave it", () => {
    const looping = doc(
      [node("end", "test-end"), node("q", "test-task", { correct: "a" })],
      [edge("end", "q")],
    );
    expect(isTerminalNode(looping, "end")).toBe(true);
    expect(nextNodeId(looping, "end", conditionContext(snapshotOf(looping)))).toBeNull();
  });

  describe("branching", () => {
    const branching = doc(
      [
        node("start", "test-start"),
        node("q", "test-task", { correct: "a" }),
        node("easy", "test-content", { text: "easy" }),
        node("hard", "test-content", { text: "hard" }),
        node("end", "test-end"),
      ],
      [
        edge("start", "q"),
        // Deliberately declared with the fallback first, to prove ordering does
        // not depend on the order edges appear in the file.
        edge("q", "easy"),
        edge("q", "hard", {
          id: "q->hard",
          condition: {
            type: "compare",
            left: { kind: "result", nodeId: "q", path: "state" },
            op: "eq",
            right: "correct",
          },
        }),
        edge("easy", "end"),
        edge("hard", "end"),
      ],
    );

    it("considers conditional edges before the unconditional fallback", () => {
      expect(outgoingEdges(branching, "q").map((e) => e.target)).toEqual([
        "hard",
        "easy",
      ]);
    });

    it("takes the conditional branch when the condition holds", () => {
      const snapshot: AttemptSnapshot = {
        ...snapshotOf(branching),
        results: { q: { state: "correct" } },
      };
      expect(nextNodeId(branching, "q", conditionContext(snapshot))).toBe("hard");
    });

    it("falls back to the unconditional edge when it does not", () => {
      const snapshot: AttemptSnapshot = {
        ...snapshotOf(branching),
        results: { q: { state: "wrong" } },
      };
      expect(nextNodeId(branching, "q", conditionContext(snapshot))).toBe("easy");
    });

    it("falls back when the referenced node has no result yet", () => {
      expect(
        nextNodeId(branching, "q", conditionContext(snapshotOf(branching))),
      ).toBe("easy");
    });
  });

  describe("distance", () => {
    it("counts hops to the end", () => {
      expect(distanceToEnd(linear, "start")).toBe(3);
      expect(distanceToEnd(linear, "end")).toBe(0);
    });

    it("takes the shortest or longest route depending on mode", () => {
      const diamond = doc(
        [
          node("start", "test-start"),
          node("short", "test-content"),
          node("longA", "test-content"),
          node("longB", "test-content"),
          node("end", "test-end"),
        ],
        [
          edge("start", "short"),
          edge("start", "longA"),
          edge("short", "end"),
          edge("longA", "longB"),
          edge("longB", "end"),
        ],
      );
      expect(distanceToEnd(diamond, "start", "optimistic")).toBe(2);
      expect(distanceToEnd(diamond, "start", "pessimistic")).toBe(3);
    });

    it("survives a cycle instead of recursing forever", () => {
      const cyclic = doc(
        [
          node("a", "test-content"),
          node("b", "test-content"),
          node("end", "test-end"),
        ],
        [edge("a", "b"), edge("b", "a"), edge("b", "end")],
      );
      expect(distanceToEnd(cyclic, "a")).toBe(2);
    });

    it("reports Infinity when no route to an end exists", () => {
      const stranded = doc(
        [node("a", "test-content"), node("b", "test-content")],
        [edge("a", "b"), edge("b", "a")],
      );
      expect(distanceToEnd(stranded, "a")).toBe(Number.POSITIVE_INFINITY);
    });
  });

  it("reports progress as visited over visited-plus-remaining", () => {
    const snapshot = snapshotOf();
    expect(flowProgress(linear, snapshot)).toEqual({
      visited: 1,
      remaining: 3,
      ratio: 0.25,
    });
    expect(
      flowProgress(linear, { ...snapshot, status: "completed" }).ratio,
    ).toBe(1);
  });
});

describe("time spent", () => {
  beforeEach(registerTestBits);

  const at = (seconds: number) =>
    new Date(Date.UTC(2026, 0, 1, 10, 0, seconds));

  /** Two minutes banked on "start", currently sitting on "q". */
  const midway = (): AttemptSnapshot => ({
    ...snapshotOf(),
    currentNodeId: "q",
    history: ["start", "q"],
    elapsedMs: { start: 120_000, q: 30_000 },
    enteredAt: at(10).toISOString(),
  });

  it("counts the stretch in progress on the current task", () => {
    // 30s banked plus 5s since arriving.
    expect(timeSpentOn(midway(), "q", at(15))).toBe(35_000);
  });

  it("counts only what is banked on a task left behind", () => {
    expect(timeSpentOn(midway(), "start", at(15))).toBe(120_000);
  });

  it("is zero for a task never reached", () => {
    expect(timeSpentOn(midway(), "end", at(15))).toBe(0);
  });

  it("totals the whole attempt, including the stretch in progress", () => {
    expect(timeSpent(midway(), at(15))).toBe(155_000);
  });

  it("stops counting once the attempt is over", () => {
    const finished: AttemptSnapshot = { ...midway(), status: "completed" };
    // An hour later it still reads the same: the clock measures time spent,
    // not wall clock, so a closed tab does not run it down.
    expect(timeSpent(finished, at(3600))).toBe(150_000);
    expect(timeSpentOn(finished, "q", at(3600))).toBe(30_000);
  });

  it("does not go backwards if the clock does", () => {
    expect(timeSpentOn(midway(), "q", at(5))).toBe(30_000);
  });

  it("reads a task's own limit off its evaluation settings", () => {
    const limited = doc(
      [node("q", "test-task", { correct: "a", evaluation: { timeLimit: 90 } })],
      [],
    );
    expect(taskTimeLimit(getNode(limited, "q"))).toBe(90_000);
    expect(taskTimeLimit(getNode(linear, "q"))).toBeNull();
    expect(taskTimeLimit(undefined)).toBeNull();
  });
});
