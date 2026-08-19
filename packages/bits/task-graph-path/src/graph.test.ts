import { describe, expect, it } from "vitest";
import {
  cutCost,
  distancesFrom,
  isRoute,
  minimumCutCost,
  neighboursOf,
  routeCost,
  spanningTreeCost,
  traversalOrder,
  treeShape,
} from "./graph";
import { DataSchema, type Data } from "./schema";

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
      { id: "a", label: "A", x: 0.2, y: 0.2 },
      { id: "b", label: "B", x: 0.8, y: 0.2 },
      { id: "c", label: "C", x: 0.2, y: 0.8 },
      { id: "d", label: "D", x: 0.8, y: 0.8 },
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
    evaluation: { mode: "skip" },
    ...over,
  });

describe("neighboursOf", () => {
  it("takes them alphabetically when that is the rule", () => {
    expect(neighboursOf(graph(), "b")).toEqual(["a", "c", "d"]);
  });

  it("takes them as drawn when that is the rule", () => {
    expect(neighboursOf(graph({ neighbourOrder: "authored" }), "b")).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("follows an arrow only forwards in a directed graph", () => {
    expect(neighboursOf(graph({ directed: true }), "b")).toEqual(["c", "d"]);
    expect(neighboursOf(graph({ directed: true }), "d")).toEqual([]);
  });
});

describe("distancesFrom", () => {
  it("finds the cheapest cost to everywhere", () => {
    // A→B→C is 3, which beats the 4 of the direct connection.
    expect([...distancesFrom(graph(), "a")]).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 3],
      ["d", 2],
    ]);
  });

  it("counts connections when the graph has no weights", () => {
    expect(distancesFrom(graph({ weighted: false }), "a").get("d")).toBe(2);
  });

  it("leaves out what cannot be reached", () => {
    const cut = graph({ edges: [{ id: "ab", source: "a", target: "b", weight: 1 }] });
    expect(distancesFrom(cut, "a").has("d")).toBe(false);
  });
});

describe("traversalOrder", () => {
  it("visits breadth first, neighbours in order", () => {
    expect(traversalOrder(graph(), "a")).toEqual(["a", "b", "c", "d"]);
  });

  it("visits depth first, neighbours in order", () => {
    // A, then B (first alphabetically), then B's first unvisited neighbour C,
    // then D — the order the recursive version goes in.
    expect(traversalOrder(graph({ traversal: "dfs" }), "a")).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("differs between the two searches when the shape makes it", () => {
    // A joins B and C; B joins D. Breadth first finishes the layer around A
    // before going deeper; depth first follows B all the way down first.
    const shape = graph({
      traversal: "dfs",
      edges: [
        { id: "ab", source: "a", target: "b", weight: 1 },
        { id: "ac", source: "a", target: "c", weight: 1 },
        { id: "bd", source: "b", target: "d", weight: 1 },
      ],
    });

    expect(traversalOrder(shape, "a")).toEqual(["a", "b", "d", "c"]);
    expect(traversalOrder({ ...shape, traversal: "bfs" }, "a")).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });
});

describe("routes", () => {
  it("knows a joined-up route from a wishful one", () => {
    expect(isRoute(graph(), ["a", "b", "d"])).toBe(true);
    expect(isRoute(graph({ directed: true }), ["d", "b", "a"])).toBe(false);
  });

  it("refuses a route that passes the same place twice", () => {
    expect(isRoute(graph(), ["a", "b", "a", "c"])).toBe(false);
  });

  it("adds up what a route costs", () => {
    expect(routeCost(graph(), ["a", "b", "d"])).toBe(2);
    expect(routeCost(graph(), ["a", "d"])).toBeUndefined();
  });
});

describe("spanning trees", () => {
  it("finds what the cheapest one costs", () => {
    // AB 1, BD 1, BC 2.
    expect(spanningTreeCost(graph())).toBe(4);
  });

  it("has none when the graph is in pieces", () => {
    expect(
      spanningTreeCost(
        graph({ edges: [{ id: "ab", source: "a", target: "b", weight: 1 }] }),
      ),
    ).toBeUndefined();
  });

  it("tells the shapes that are not a tree apart", () => {
    expect(treeShape(graph(), ["ab", "bd", "bc"])).toBe("tree");
    expect(treeShape(graph(), ["ab", "ac", "bc"])).toBe("cycle");
    expect(treeShape(graph(), ["ab", "bd"])).toBe("wrongSize");
    expect(treeShape(graph(), ["ab", "bd", "bc", "cd"])).toBe("wrongSize");
  });

  it("calls a set that leaves a place out disconnected", () => {
    const square = graph({
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
        { id: "d", label: "D" },
      ],
      edges: [
        { id: "ab", source: "a", target: "b", weight: 1 },
        { id: "cd", source: "c", target: "d", weight: 1 },
        { id: "bc", source: "b", target: "c", weight: 1 },
      ],
    });

    // Two pieces of two, and one connection too few to be a tree over four.
    expect(treeShape(square, ["ab", "cd"])).toBe("wrongSize");
  });
});

describe("cuts", () => {
  it("adds up what separating a set costs", () => {
    // Leaving A alone cuts AB (1) and AC (4).
    expect(cutCost(graph(), ["a"])).toBe(5);
  });

  it("finds the cheapest separation", () => {
    // D hangs off B and C: BD 1 and CD 5 is 6, against A's own 5.
    expect(minimumCutCost(graph(), "a", "d")).toBe(5);
  });

  it("counts a directed connection only where it points", () => {
    const oneWay = graph({ directed: true });

    // Leaving B outside cuts A→B alone: B→C and B→D point away from the near
    // side, so they are not connections that have to be severed.
    expect(cutCost(oneWay, ["a", "c", "d"])).toBe(1);
    expect(cutCost(graph(), ["a", "c", "d"])).toBe(4);
  });

  it("finds nothing to cut when nothing leads there", () => {
    // Every arrow runs away from D, so D reaches A for nothing at all.
    expect(minimumCutCost(graph({ directed: true }), "d", "a")).toBe(0);
  });

  it("separates nothing from itself", () => {
    expect(minimumCutCost(graph(), "a", "a")).toBeUndefined();
  });
});
