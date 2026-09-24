import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";
import { parseTreeText, traversalOrder } from "./tree";

const treeOf = (text: string) => {
  const result = parseTreeText(text);
  if ("error" in result) throw new Error(result.error);
  return result.tree;
};

const data = (over: Partial<Data>): Data =>
  DataSchema.parse({
    tree: treeOf("8 (3 (1) (6)) (10)"),
    evaluation: defaultEvaluation(),
    ...over,
  });

const idOf = (d: Data, label: string) => d.tree.nodes.find((node) => node.label === label)!.id;

describe("DataSchema", () => {
  it("wants a search tree for searching", () => {
    const result = DataSchema.safeParse({
      mode: "search",
      searchKey: "3",
      tree: treeOf("8 (9) (10)"),
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });

  it("refuses a key listed to insert twice, or already in the tree", () => {
    const twice = DataSchema.safeParse({
      mode: "insert",
      insertKeys: ["4", "4"],
      evaluation: defaultEvaluation(),
    });
    expect(twice.success).toBe(false);
    const there = DataSchema.safeParse({
      mode: "insert",
      tree: treeOf("8"),
      insertKeys: ["8"],
      evaluation: defaultEvaluation(),
    });
    expect(there.success).toBe(false);
  });

  it("refuses a child shared between two parents", () => {
    const result = DataSchema.safeParse({
      tree: {
        root: "a",
        nodes: [
          { id: "a", label: "a", left: "c", right: "b" },
          { id: "b", label: "b", left: "c" },
          { id: "c", label: "c" },
        ],
      },
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });
});

describe("evaluate", () => {
  it("marks a traversal right in full, and part-right up to the first mistake", () => {
    const d = data({ mode: "traversal", traversal: "preorder" });
    const right = traversalOrder(d.tree.nodes, d.tree.root, "preorder");
    expect(evaluate({ data: d, answer: { sequence: right, placements: [] } }).state).toBe(
      "correct",
    );

    const swapped = [right[0], right[2], right[1], ...right.slice(3)];
    const result = evaluate({ data: d, answer: { sequence: swapped, placements: [] } });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 5 });
    expect(result.detail).toMatchObject({ reason: "wrongOrder", correctPrefix: 1 });
  });

  it("wants 'not found' at the end of a search for a missing key", () => {
    const d = data({ mode: "search", searchKey: "7" });
    const path = ["8", "3", "6"].map((label) => idOf(d, label));
    expect(
      evaluate({ data: d, answer: { sequence: path, placements: [] } }).detail,
    ).toMatchObject({ reason: "missedNotFound" });
    expect(
      evaluate({ data: d, answer: { sequence: path, notFound: true, placements: [] } }).state,
    ).toBe("correct");
  });

  it("marks each inserted key by where it was put", () => {
    const d = data({ mode: "insert", tree: { nodes: [], root: undefined }, insertKeys: ["5", "2", "8"] });
    const result = evaluate({
      data: d,
      answer: {
        sequence: [],
        placements: [
          { key: "5", parent: null, side: "root" },
          { key: "2", parent: "insert-0", side: "right" },
          { key: "8", parent: "insert-0", side: "right" },
        ],
      },
    });
    expect(result.detail).toMatchObject({ states: ["correct", "wrong", "correct"] });
    expect(result.score).toEqual({ earned: 2, possible: 3 });
  });
});
