import { describe, expect, it } from "vitest";
import {
  buildBstFromKeys,
  expectedPlacements,
  layoutTree,
  parseTreeText,
  searchPath,
  traversalOrder,
  treeToText,
} from "./tree";
import type { Tree } from "./schema";

const parsed = (text: string): Tree => {
  const result = parseTreeText(text);
  if ("error" in result) throw new Error(result.error);
  return result.tree;
};

/** Labels rather than ids, for readable expectations. */
const labels = (tree: Tree, ids: string[]) =>
  ids.map((id) => tree.nodes.find((node) => node.id === id)?.label);

//        8
//      /   \
//     3     10
//    / \      \
//   1   6      14
//      / \     /
//     4   7   13
const BOOK = "8 (3 (1) (6 (4) (7))) (10 () (14 (13)))";

describe("parseTreeText", () => {
  it("reads a key followed by its left and right subtrees", () => {
    const tree = parsed(BOOK);
    expect(tree.nodes).toHaveLength(9);
    const ten = tree.nodes.find((node) => node.label === "10")!;
    expect(ten.left).toBeUndefined();
    expect(tree.nodes.find((node) => node.id === ten.right)?.label).toBe("14");
  });

  it("reads back what treeToText writes", () => {
    expect(treeToText(parsed(BOOK))).toBe(BOOK);
  });

  it("names the problem as a message key for the form", () => {
    expect(parseTreeText("8 (3")).toEqual({ error: "parseMissingClose", vars: { key: "8" } });
    expect(parseTreeText("8 (1) (2) (3)")).toMatchObject({ error: "parseTooManyChildren" });
    expect(parseTreeText("(8)")).toEqual({ error: "parseExpectedKey" });
    expect(parseTreeText("8 9")).toEqual({ error: "parseTrailing", vars: { token: "9" } });
  });

  it("reads nothing as the empty tree", () => {
    expect(parsed("  ")).toEqual({ nodes: [], root: undefined });
  });
});

describe("traversalOrder", () => {
  const tree = parsed(BOOK);
  const order = (kind: Parameters<typeof traversalOrder>[2]) =>
    labels(tree, traversalOrder(tree.nodes, tree.root, kind)).join(" ");

  it("visits in all four orders", () => {
    expect(order("preorder")).toBe("8 3 1 6 4 7 10 14 13");
    expect(order("inorder")).toBe("1 3 4 6 7 8 10 13 14");
    expect(order("postorder")).toBe("1 4 7 6 3 13 14 10 8");
    expect(order("levelorder")).toBe("8 3 10 1 6 14 4 7 13");
  });
});

describe("searchPath", () => {
  const tree = parsed(BOOK);

  it("walks down to a key that is there", () => {
    const { path, found } = searchPath(tree.nodes, tree.root, "7", true);
    expect(labels(tree, path)).toEqual(["8", "3", "6", "7"]);
    expect(found).toBe(true);
  });

  it("stops at the last place for a key that is not", () => {
    const { path, found } = searchPath(tree.nodes, tree.root, "12", true);
    expect(labels(tree, path)).toEqual(["8", "10", "14", "13"]);
    expect(found).toBe(false);
  });

  it("compares numbers as numbers, not as text", () => {
    // As text "10" < "8"; as numbers it is the other way round.
    const { path } = searchPath(tree.nodes, tree.root, "10", true);
    expect(labels(tree, path)).toEqual(["8", "10"]);
  });
});

describe("insertion", () => {
  it("places each key where a search for it ends", () => {
    const empty: Tree = { nodes: [], root: undefined };
    expect(expectedPlacements(empty, ["5", "2", "8", "1"], true)).toEqual([
      { key: "5", parent: null, side: "root" },
      { key: "2", parent: "insert-0", side: "left" },
      { key: "8", parent: "insert-0", side: "right" },
      { key: "1", parent: "insert-1", side: "left" },
    ]);
  });

  it("builds the book's tree from its keys", () => {
    const tree = buildBstFromKeys(["8", "3", "10", "1", "6", "14", "4", "7", "13"], true);
    expect(treeToText(tree)).toBe(BOOK);
  });
});

describe("layoutTree", () => {
  it("puts nodes left to right in order and deeper nodes lower", () => {
    const tree = parsed("2 (1) (3)");
    const layout = layoutTree(tree.nodes, tree.root, false);
    const byLabel = Object.fromEntries(
      layout.nodes.map((node) => [node.label, node]),
    );
    expect(byLabel["1"].x).toBeLessThan(byLabel["2"].x);
    expect(byLabel["2"].x).toBeLessThan(byLabel["3"].x);
    expect(byLabel["1"].y).toBeGreaterThan(byLabel["2"].y);
    expect(layout.slots).toEqual([]);
  });

  it("offers an empty place under every missing child when inserting", () => {
    const tree = parsed("2 (1) (3)");
    expect(layoutTree(tree.nodes, tree.root, true).slots).toHaveLength(4);
    expect(layoutTree([], undefined, true).slots).toEqual([
      expect.objectContaining({ parentId: null, side: "root" }),
    ]);
  });
});
