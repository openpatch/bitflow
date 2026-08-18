import { describe, expect, it } from "vitest";
import { layout } from "./layout";
import { doc, edge, node } from "./test-utils";

/** `id → { x, y }`, which is all these tests care about. */
const positions = (result: ReturnType<typeof layout>) =>
  Object.fromEntries(result.nodes.map((n) => [n.id, n.position]));

/** Nodes at the same height, left to right. */
const row = (result: ReturnType<typeof layout>, y: number): string[] =>
  result.nodes
    .filter((n) => n.position.y === y)
    .sort((a, b) => a.position.x - b.position.x)
    .map((n) => n.id);

describe("layout", () => {
  it("puts a straight flow in one column, in order", () => {
    const flow = doc(
      [
        node("start", "test-start"),
        node("q", "test-task"),
        node("end", "test-end"),
      ],
      [edge("start", "q"), edge("q", "end")],
      {},
    );

    const placed = positions(layout(flow));

    expect(placed.start.y).toBeLessThan(placed.q.y);
    expect(placed.q.y).toBeLessThan(placed.end.y);
    expect(placed.start.x).toBe(placed.q.x);
  });

  it("puts a branch's two sides side by side", () => {
    const flow = doc(
      [
        node("start", "test-start"),
        node("yes", "test-task"),
        node("no", "test-task"),
        node("end", "test-end"),
      ],
      [
        edge("start", "yes"),
        edge("start", "no"),
        edge("yes", "end"),
        edge("no", "end"),
      ],
      {},
    );

    const result = layout(flow);

    expect(row(result, 140)).toEqual(["yes", "no"]);
    expect(row(result, 0)).toEqual(["start"]);
    expect(row(result, 280)).toEqual(["end"]);
  });

  it("draws a step below everything that can reach it", () => {
    // `end` is reachable from `start` directly and through two more steps.
    // Shortest-path depth would draw it level with `a`, above its own
    // predecessor `b`, and the edge would run backwards up the canvas.
    const flow = doc(
      [
        node("start", "test-start"),
        node("a", "test-task"),
        node("b", "test-task"),
        node("end", "test-end"),
      ],
      [edge("start", "a"), edge("a", "b"), edge("b", "end"), edge("start", "end")],
      {},
    );

    const placed = positions(layout(flow));

    expect(placed.end.y).toBeGreaterThan(placed.b.y);
    expect(placed.b.y).toBeGreaterThan(placed.a.y);
  });

  it("terminates on a flow that loops back", () => {
    // A retry loop has no longest path; relaxation has to stop anyway.
    const flow = doc(
      [
        node("start", "test-start"),
        node("q", "test-task"),
        node("again", "test-task"),
      ],
      [edge("start", "q"), edge("q", "again"), edge("again", "q")],
      {},
    );

    const placed = positions(layout(flow));

    expect(placed.start.y).toBe(0);
    expect(Number.isFinite(placed.q.y)).toBe(true);
    expect(Number.isFinite(placed.again.y)).toBe(true);
  });

  it("puts an unreachable step below the flow, not on top of the start", () => {
    const flow = doc(
      [
        node("start", "test-start"),
        node("q", "test-task"),
        node("orphan", "test-task"),
      ],
      [edge("start", "q")],
      {},
    );

    const placed = positions(layout(flow));

    expect(placed.orphan.y).toBeGreaterThan(placed.q.y);
  });

  it("lays an orphaned chain out as its own flow, below", () => {
    const flow = doc(
      [
        node("start", "test-start"),
        node("q", "test-task"),
        node("loose-a", "test-task"),
        node("loose-b", "test-task"),
      ],
      [edge("start", "q"), edge("loose-a", "loose-b")],
      {},
    );

    const placed = positions(layout(flow));

    // Below the connected flow, and still in its own order rather than
    // flattened into one row.
    expect(placed["loose-a"].y).toBeGreaterThan(placed.q.y);
    expect(placed["loose-b"].y).toBeGreaterThan(placed["loose-a"].y);
  });

  it("terminates when every remaining step is inside a cycle", () => {
    // Two nodes pointing at each other, reachable from nothing: there is no
    // root to seed, so the loop has to break the tie itself.
    const flow = doc(
      [
        node("start", "test-start"),
        node("a", "test-task"),
        node("b", "test-task"),
      ],
      [edge("a", "b"), edge("b", "a")],
      {},
    );

    const placed = positions(layout(flow));

    expect(Number.isFinite(placed.a.y)).toBe(true);
    expect(Number.isFinite(placed.b.y)).toBe(true);
  });

  it("changes nothing but the positions", () => {
    const flow = doc(
      [node("start", "test-start", { title: "Hello" }), node("q", "test-task")],
      [edge("start", "q")],
      { title: "Kept" },
    );

    const result = layout(flow);

    expect(result.meta).toEqual(flow.meta);
    expect(result.edges).toEqual(flow.edges);
    expect(result.nodes.map((n) => n.data)).toEqual(flow.nodes.map((n) => n.data));
  });

  it("leaves an empty flow alone", () => {
    const empty = doc([], [], {});
    expect(layout(empty)).toBe(empty);
  });
});
