import { describe, expect, it } from "vitest";
import { answerOf, DataSchema, withAnswer } from "./schema";

const base = {
  nodes: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  edges: [{ id: "ab", source: "a", target: "b", weight: 1 }],
  sourceId: "a",
  targetId: "b",
};

const messages = (over: Record<string, unknown> = {}) =>
  (DataSchema.safeParse({ ...base, ...over }).error?.issues ?? []).map(
    (issue) => issue.message,
  );

describe("DataSchema", () => {
  it("accepts a graph that can be answered", () => {
    expect(messages()).toEqual([]);
  });

  it("wants two places and a connection", () => {
    expect(messages({ nodes: [base.nodes[0]], edges: [] }).join(" ")).toMatch(
      /at least two places/i,
    );
  });

  it("wants every place named", () => {
    expect(
      messages({ nodes: [{ id: "a", label: "" }, base.nodes[1]] }).join(" "),
    ).toMatch(/give the place a name/i);
  });

  it("refuses a connection to a place that does not exist", () => {
    expect(
      messages({ edges: [{ id: "ax", source: "a", target: "x", weight: 1 }] }).join(" "),
    ).toMatch(/two places that exist/i);
  });

  it("refuses a connection from a place to itself", () => {
    expect(
      messages({ edges: [{ id: "aa", source: "a", target: "a", weight: 1 }] }).join(" "),
    ).toMatch(/to itself/i);
  });

  it("refuses two connections between the same places", () => {
    // The answer names connections, so a second one makes "the connection from
    // A to B" mean two things.
    expect(
      messages({
        edges: [
          { id: "ab", source: "a", target: "b", weight: 1 },
          { id: "ba", source: "b", target: "a", weight: 2 },
        ],
      }).join(" "),
    ).toMatch(/already joined/i);
  });

  it("allows both directions when the graph is directed", () => {
    expect(
      messages({
        directed: true,
        goal: "path",
        edges: [
          { id: "ab", source: "a", target: "b", weight: 1 },
          { id: "ba", source: "b", target: "a", weight: 2 },
        ],
      }),
    ).toEqual([]);
  });

  it("wants a start and a finish where the goal has them", () => {
    expect(messages({ sourceId: "" }).join(" ")).toMatch(/where the answer starts/i);
    expect(messages({ targetId: "" }).join(" ")).toMatch(/where the answer finishes/i);
    expect(messages({ targetId: "a" }).join(" ")).toMatch(/different places/i);
  });

  it("asks for no finish where the goal has none", () => {
    expect(messages({ goal: "spanningTree", sourceId: "", targetId: "" })).toEqual([]);
  });

  it("refuses a spanning tree of a directed graph", () => {
    // It is a different object with a different algorithm; pretending
    // otherwise would mark honest answers wrong.
    expect(
      messages({ goal: "spanningTree", directed: true, sourceId: "", targetId: "" }).join(
        " ",
      ),
    ).toMatch(/undirected/i);
  });

  it("refuses a place outside the diagram", () => {
    expect(
      messages({ nodes: [{ id: "a", label: "A", x: 1.5 }, base.nodes[1]] }).length,
    ).toBeGreaterThan(0);
  });

  it("leaves an ungraded task alone", () => {
    expect(
      messages({ nodes: [], edges: [], sourceId: "", targetId: "", evaluation: { mode: "skip" } }),
    ).toEqual([]);
  });
});

describe("the answer", () => {
  it("keeps places for one goal and connections for another", () => {
    // Never both: a route recorded twice is a route that can come back from a
    // reload disagreeing with itself.
    expect(withAnswer("path", ["a", "b"])).toEqual({
      nodeIds: ["a", "b"],
      edgeIds: [],
    });
    expect(withAnswer("spanningTree", ["ab"])).toEqual({
      nodeIds: [],
      edgeIds: ["ab"],
    });
  });

  it("reads back whichever list the goal fills", () => {
    expect(answerOf("cut", { nodeIds: ["a"], edgeIds: [] })).toEqual(["a"]);
    expect(answerOf("spanningTree", { nodeIds: [], edgeIds: ["ab"] })).toEqual(["ab"]);
    expect(answerOf("path", undefined)).toEqual([]);
  });
});
