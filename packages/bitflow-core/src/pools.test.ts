import { beforeEach, describe, expect, it } from "vitest";
import { createAttempt, goNext, setAnswer } from "./attempt";
import { drawPools, flowProgress, isActiveNode, poolMembers } from "./engine";
import { validateFlow } from "./validate";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { AttemptSnapshot, BitflowDocument } from "./schema";

/**
 * A pool of four questions chained in a line, of which each learner gets two.
 * The chain is the point: members are ordinary nodes wired together as usual,
 * and the ones a learner did not draw are stepped over.
 */
const flow = (draw = 2): BitflowDocument =>
  doc(
    [
      node("start", "test-start"),
      { ...node("q1", "test-task", { correct: "a" }), pool: "questions" },
      { ...node("q2", "test-task", { correct: "a" }), pool: "questions" },
      { ...node("q3", "test-task", { correct: "a" }), pool: "questions" },
      { ...node("q4", "test-task", { correct: "a" }), pool: "questions" },
      node("end", "test-end"),
    ],
    [
      edge("start", "q1"),
      edge("q1", "q2"),
      edge("q2", "q3"),
      edge("q3", "q4"),
      edge("q4", "end"),
    ],
    "pooled",
    { pools: [{ id: "questions", label: "Questions", draw }] },
  );

/** A generator that cycles through fixed values, so a draw is reproducible. */
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length];
};

/** Walks the whole flow, answering every task, and returns the nodes seen. */
const walk = (document: BitflowDocument, snapshot: AttemptSnapshot): string[] => {
  const seen = [snapshot.currentNodeId];
  let current = snapshot;
  for (let step = 0; step < 20; step++) {
    current = setAnswer(current, current.currentNodeId, "a");
    const next = goNext(document, current);
    if (next.currentNodeId === current.currentNodeId) break;
    current = next;
    seen.push(current.currentNodeId);
    if (current.status !== "inProgress") break;
  }
  return seen;
};

describe("item pools", () => {
  beforeEach(registerTestBits);

  it("collects a pool's members off the nodes", () => {
    expect(poolMembers(flow(), "questions").map((n) => n.id)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
    ]);
  });

  it("draws as many as the pool asks for", () => {
    const drawn = drawPools(flow(2), sequence(0));
    expect(drawn.questions).toHaveLength(2);
  });

  it("gives different learners different draws", () => {
    // Two attempts, two generators: the draw is per attempt, not per document.
    const first = drawPools(flow(2), sequence(0));
    const second = drawPools(flow(2), sequence(0.99));
    expect(first.questions).not.toEqual(second.questions);
  });

  it("hands out all of them when the pool is asked for more than it has", () => {
    // Validation warns the author; a learner mid-assessment is the wrong place
    // to enforce it.
    expect(drawPools(flow(10), sequence(0)).questions).toHaveLength(4);
  });

  it("records the draw on the attempt so a reload resumes the same one", () => {
    const created = createAttempt(flow(2), { random: sequence(0.3, 0.7) });
    if (!created.ok) throw new Error(created.error.message);

    expect(created.value.pools.questions).toHaveLength(2);
  });

  it("walks past the steps this learner did not draw", () => {
    const document = flow(2);
    const created = createAttempt(document, { random: sequence(0) });
    if (!created.ok) throw new Error(created.error.message);

    const seen = walk(document, created.value);
    const questions = seen.filter((id) => id.startsWith("q"));

    expect(questions).toHaveLength(2);
    expect(questions).toEqual(created.value.pools.questions.slice().sort());
    // Undrawn members are never landed on, however many are chained together.
    expect(seen[0]).toBe("start");
    expect(seen[seen.length - 1]).toBe("end");
  });

  it("still reaches the end when the draw is at the very end of the chain", () => {
    const document = flow(1);
    const created = createAttempt(document, { random: () => 0 });
    if (!created.ok) throw new Error(created.error.message);

    expect(walk(document, created.value)).toContain("end");
  });

  it("counts only the steps this learner will take", () => {
    const document = flow(2);
    const created = createAttempt(document, { random: sequence(0) });
    if (!created.ok) throw new Error(created.error.message);

    // start + two questions + end, not start + four + end.
    const progress = flowProgress(document, created.value);
    expect(progress.visited + progress.remaining).toBe(4);
  });

  it("shows a step whose pool the attempt knows nothing about", () => {
    // An attempt saved before the pool existed. Hiding steps on the strength
    // of missing data is the worse failure.
    const created = createAttempt(flow(2), { random: sequence(0) });
    if (!created.ok) throw new Error(created.error.message);
    const older = { ...created.value, pools: {} };

    for (const member of poolMembers(flow(), "questions")) {
      expect(isActiveNode(older, member)).toBe(true);
    }
  });

  it("leaves everything outside a pool alone", () => {
    const created = createAttempt(flow(2), { random: sequence(0) });
    if (!created.ok) throw new Error(created.error.message);

    expect(isActiveNode(created.value, node("start", "test-start"))).toBe(true);
  });

  describe("validation", () => {
    const messages = (document: BitflowDocument) =>
      validateFlow(document).diagnostics.map((d) => d.message);

    it("accepts a pool that draws some of its members", () => {
      expect(validateFlow(flow(2)).valid).toBe(true);
    });

    it("reports a pool with nothing in it", () => {
      const empty = doc(
        [node("start", "test-start"), node("end", "test-end")],
        [edge("start", "end")],
        "empty-pool",
        { pools: [{ id: "questions", label: "Questions", draw: 2 }] },
      );
      expect(messages(empty).join(" ")).toContain("has no steps in it");
    });

    it("reports a pool that draws more than it has", () => {
      expect(messages(flow(10)).join(" ")).toContain("only has 4");
    });

    it("reports a pool that draws all of its members", () => {
      // It looks like it varies and does not, which is worth saying.
      expect(messages(flow(4)).join(" ")).toContain("every learner gets the same");
    });

    it("reports a step in a pool the flow does not declare", () => {
      const stray = doc(
        [
          node("start", "test-start"),
          { ...node("q", "test-task", { correct: "a" }), pool: "ghost" },
          node("end", "test-end"),
        ],
        [edge("start", "q"), edge("q", "end")],
        "stray",
      );
      expect(messages(stray).join(" ")).toContain("does not declare");
    });

    it("refuses a pooled start or end", () => {
      const pooled = doc(
        [
          node("start", "test-start"),
          { ...node("end", "test-end"), pool: "questions" },
        ],
        [edge("start", "end")],
        "pooled-end",
        { pools: [{ id: "questions", label: "", draw: 1 }] },
      );
      expect(messages(pooled).join(" ")).toContain("cannot be part of a pool");
    });
  });
});
