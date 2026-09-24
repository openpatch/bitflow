import type { Data, Placement, TraversalKind, Tree, TreeNode } from "./schema";

/**
 * Everything about a tree that is *computed* rather than authored: the text
 * notation and its parser, the comparator search and insertion use, the four
 * traversal orders, a binary search tree's search path and its insertion
 * points, and the layout that turns a tree into positions on a diagram.
 *
 * Nothing here is a React component and nothing here reads `evaluation` or
 * `instruction` — this file is the algorithm, `evaluate.ts` is the marking,
 * and `TreeView.tsx` is the picture. Keeping them apart is what lets the
 * algorithm be tested without mounting anything.
 */

// --- keys --------------------------------------------------------------

/**
 * Whether a piece of text parses as a plain number: no leading or trailing
 * junk, so "12" and "-3.5" count but "12a", "1e3" and "" do not. Deliberately
 * narrower than `Number()`, which reads `""` as zero and would silently make
 * every blank key "numeric".
 */
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
export const parsesAsNumber = (key: string): boolean => NUMBER.test(key.trim());

/**
 * Whether a whole task's worth of keys should be compared as numbers.
 *
 * All of them, or none: a tree with even one key that is not a number cannot
 * be kept in numeric order at all, so falling back to text for every key is
 * the only rule that stays consistent for the whole task rather than
 * switching partway down the comparisons a search makes.
 */
export const isNumericMode = (data: Data): boolean => {
  const extra =
    data.mode === "search"
      ? [data.searchKey]
      : data.mode === "insert"
        ? data.insertKeys
        : [];
  const keys = [...data.tree.nodes.map((node) => node.label), ...extra].filter(
    (key) => key.trim() !== "",
  );
  return keys.length > 0 && keys.every(parsesAsNumber);
};

/**
 * The one comparator search, insertion and the "already in the tree" check
 * all use. Numeric when the task is in numeric mode; otherwise
 * `localeCompare` with `numeric: true`, so "item2" still sorts before
 * "item10" in a tree of names.
 */
export const compareKeys = (a: string, b: string, numeric: boolean): number =>
  numeric ? Number(a) - Number(b) : a.localeCompare(b, undefined, { numeric: true });

/** The first key that occurs twice, comparing with the task's own comparator. */
export const findDuplicateKey = (keys: string[], numeric: boolean): string | undefined => {
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      if (compareKeys(keys[i], keys[j], numeric) === 0) return keys[j];
    }
  }
  return undefined;
};

/** A list of keys, split on commas and whitespace: "8, 3, 10" or "8 3 10" alike. */
export const parseKeyList = (text: string): string[] =>
  text
    .split(/[,\s]+/)
    .map((key) => key.trim())
    .filter((key) => key !== "");

// --- shape ---------------------------------------------------------------

/** Whether a child id points somewhere twice: the other half of "is a tree". */
export const findMultiParented = (nodes: TreeNode[]): string | undefined => {
  const seen = new Set<string>();
  for (const node of nodes) {
    for (const child of [node.left, node.right]) {
      if (child === undefined) continue;
      if (seen.has(child)) return child;
      seen.add(child);
    }
  }
  return undefined;
};

/**
 * Whether every node hangs off `root` through `left`/`right`, with nothing
 * left over and nothing looping back on itself.
 *
 * A node can pass the "at most one parent" check (`findMultiParented`) and
 * still not be part of the tree at all — two nodes pointing at each other off
 * to the side, say. Walking down from the root and counting what it reaches
 * is the only check that catches that: anything not visited is either cut
 * off or part of a cycle the parent check could not see.
 */
export const reachesEveryNode = (nodes: TreeNode[], root: string | undefined): boolean => {
  if (nodes.length === 0) return root === undefined;
  if (root === undefined) return false;

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const stack = [root];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (visited.has(id)) continue; // seeing it twice can only mean a loop
    visited.add(id);
    const node = byId.get(id);
    if (!node) continue;
    if (node.left !== undefined) stack.push(node.left);
    if (node.right !== undefined) stack.push(node.right);
  }
  return visited.size === nodes.length;
};

/**
 * Whether the tree keeps the ordering a binary search over it depends on:
 * everything under a node's left is less, everything under its right is
 * more, all the way down — not just against the immediate parent, which
 * would let a value sneak past an ancestor two levels up.
 */
export const isBst = (nodes: TreeNode[], root: string | undefined, numeric: boolean): boolean => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const inBounds = (
    id: string | undefined,
    low: string | undefined,
    high: string | undefined,
  ): boolean => {
    if (id === undefined) return true;
    const node = byId.get(id);
    if (!node) return false;
    if (low !== undefined && compareKeys(node.label, low, numeric) <= 0) return false;
    if (high !== undefined && compareKeys(node.label, high, numeric) >= 0) return false;
    return inBounds(node.left, low, node.label) && inBounds(node.right, node.label, high);
  };
  return inBounds(root, undefined, undefined);
};

// --- traversal -------------------------------------------------------------


/**
 * The order a traversal visits places in, computed from the tree rather than
 * authored separately — so the answer can never drift from the diagram it is
 * asked about.
 */
export const traversalOrder = (
  nodes: TreeNode[],
  root: string | undefined,
  kind: TraversalKind,
): string[] => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const order: string[] = [];

  if (kind === "levelorder") {
    const queue = root !== undefined ? [root] : [];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      order.push(id);
      const node = byId.get(id);
      if (!node) continue;
      if (node.left !== undefined) queue.push(node.left);
      if (node.right !== undefined) queue.push(node.right);
    }
    return order;
  }

  const visit = (id: string | undefined) => {
    if (id === undefined) return;
    const node = byId.get(id);
    if (!node) return;
    if (kind === "preorder") order.push(id);
    visit(node.left);
    if (kind === "inorder") order.push(id);
    visit(node.right);
    if (kind === "postorder") order.push(id);
  };
  visit(root);
  return order;
};

// --- search ------------------------------------------------------------

/**
 * The places a binary search visits looking for `key`, in order, and whether
 * it found it. Absent, the path ends at the last place a missing child would
 * have been — the place the learner has to say "not found" at.
 */
export const searchPath = (
  nodes: TreeNode[],
  root: string | undefined,
  key: string,
  numeric: boolean,
): { path: string[]; found: boolean } => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path: string[] = [];
  let at = root;
  while (at !== undefined) {
    path.push(at);
    const node = byId.get(at);
    if (!node) break;
    const cmp = compareKeys(key, node.label, numeric);
    if (cmp === 0) return { path, found: true };
    at = cmp < 0 ? node.left : node.right;
  }
  return { path, found: false };
};

// --- insertion -------------------------------------------------------------

/**
 * A tree with `placements` grafted onto it, each as a fresh node.
 *
 * Every placement gets the id `insert-<its position>`, whatever key it holds
 * and wherever it was aimed — including a wrong aim, so a wrong placement
 * stays visibly wrong and the next key is placed into the tree as it actually
 * stands, mistakes included. Because the id is a function of *position* and
 * nothing else, the very same ids come out whether this is applied to the
 * learner's own answer or, in `expectedPlacements` below, to the placements a
 * correct run would have made — which is what lets the two be compared
 * position by position without either one knowing about the other.
 */
export const treeWithPlacements = (tree: Tree, placements: Placement[]): Tree => {
  const nodes = tree.nodes.map((node) => ({ ...node }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let root = tree.root;

  placements.forEach((placement, index) => {
    const id = `insert-${index}`;
    const created: TreeNode = { id, label: placement.key };
    nodes.push(created);
    byId.set(id, created);

    if (placement.side === "root") {
      root = id;
      return;
    }
    const parent = placement.parent !== null ? byId.get(placement.parent) : undefined;
    if (!parent) return; // a malformed answer; leave the new node unattached
    if (placement.side === "left") parent.left = id;
    else parent.right = id;
  });

  return { nodes, root };
};

/** Where `key` lands if inserted into `tree` right now. */
const placeOf = (tree: Tree, key: string, numeric: boolean): Placement => {
  if (tree.root === undefined) return { key, parent: null, side: "root" };

  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  let at = tree.root;
  for (;;) {
    const node = byId.get(at) as TreeNode;
    const cmp = compareKeys(key, node.label, numeric);
    const side = cmp < 0 ? "left" : "right";
    const childId = side === "left" ? node.left : node.right;
    if (childId === undefined) return { key, parent: at, side };
    at = childId;
  }
};

/**
 * Where each key in turn belongs, inserting them one after another into
 * `tree` — the correct answer for "insert" mode.
 *
 * Computed by simulating a run where every placement so far was right, never
 * from what the learner actually did: "insert 8 next" has one right answer
 * regardless of where the learner put 5 a moment ago, and marking against
 * their mistake would make a second wrong placement follow inevitably from
 * the first, which is not a fair reading of whether they know where 8 goes.
 */
export const expectedPlacements = (tree: Tree, keys: string[], numeric: boolean): Placement[] => {
  const placements: Placement[] = [];
  for (const key of keys) {
    const soFar = treeWithPlacements(tree, placements);
    placements.push(placeOf(soFar, key, numeric));
  }
  return placements;
};

/**
 * A binary search tree built by inserting `keys` one after another into
 * nothing, for the "build from keys" authoring shortcut. A key already seen
 * — comparing with the task's own comparator — is skipped rather than
 * producing a tree the schema would then refuse to save.
 */
export const buildBstFromKeys = (keys: string[], numeric: boolean): Tree => {
  const deduped: string[] = [];
  for (const key of keys) {
    if (key.trim() === "") continue;
    if (!deduped.some((existing) => compareKeys(existing, key, numeric) === 0)) {
      deduped.push(key);
    }
  }
  const empty: Tree = { nodes: [], root: undefined };
  return treeWithPlacements(empty, expectedPlacements(empty, deduped, numeric));
};

// --- text notation -----------------------------------------------------

/**
 * The authoring notation for a tree: a key, then zero, one or two
 * parenthesised children — the first is the left child, the second the
 * right, and an explicit empty pair `()` stands in for a missing left when
 * only a right child follows it. A key holds neither whitespace nor a
 * parenthesis, since those are what separates one token from the next.
 *
 *   8 (3 (1) (6 (4) (7))) (10 () (14 (13)))
 *
 * is the tree
 *
 *            8
 *          /   \
 *         3     10
 *        / \       \
 *       1   6      14
 *          / \     /
 *         4   7   13
 *
 * An empty string parses to an empty tree — no root at all — which is the
 * only way an "insert" task starts with nothing to insert into.
 */
export type ParseResult =
  | { tree: Tree }
  /** A key into the form's messages and the values it needs: the form speaks
   *  the author's language, so the parser only says which problem it was. */
  | { error: string; vars?: Record<string, string> };

type Token = { kind: "key"; value: string } | { kind: "(" } | { kind: ")" };

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ kind: ch });
      i++;
      continue;
    }
    let j = i;
    while (j < text.length && !/[\s()]/.test(text[j])) j++;
    tokens.push({ kind: "key", value: text.slice(i, j) });
    i = j;
  }
  return tokens;
};

export const parseTreeText = (text: string): ParseResult => {
  const trimmed = text.trim();
  if (trimmed === "") return { tree: { nodes: [], root: undefined } };

  const tokens = tokenize(trimmed);
  let pos = 0;
  const nodes: TreeNode[] = [];
  let counter = 0;

  /** One node and however many of its two children follow it. */
  const parseNode = (): string | { error: string; vars?: Record<string, string> } => {
    const token = tokens[pos];
    if (!token || token.kind !== "key") {
      return { error: "parseExpectedKey" };
    }
    pos++;
    const id = `n${counter++}`;
    const node: TreeNode = { id, label: token.value };
    nodes.push(node);

    const groups: (string | undefined)[] = [];
    while (tokens[pos]?.kind === "(") {
      pos++; // consume "("
      if (tokens[pos]?.kind === ")") {
        pos++;
        groups.push(undefined);
      } else {
        const child = parseNode();
        if (typeof child !== "string") return child;
        if (tokens[pos]?.kind !== ")") {
          return { error: "parseMissingClose", vars: { key: node.label } };
        }
        pos++;
        groups.push(child);
      }
      if (groups.length > 2) {
        return { error: "parseTooManyChildren", vars: { key: node.label } };
      }
    }

    if (groups.length > 0) node.left = groups[0];
    if (groups.length > 1) node.right = groups[1];
    return id;
  };

  const result = parseNode();
  if (typeof result !== "string") return result;
  if (pos !== tokens.length) {
    const leftover = tokens[pos];
    const shown = leftover.kind === "key" ? leftover.value : leftover.kind;
    return { error: "parseTrailing", vars: { token: shown } };
  }

  return { tree: { nodes, root: result } };
};

/** The inverse of `parseTreeText`, so an authored tree can be shown as text again. */
export const treeToText = (tree: Tree): string => {
  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  const render = (id: string | undefined): string => {
    if (id === undefined) return "";
    const node = byId.get(id) as TreeNode;
    const hasLeft = node.left !== undefined;
    const hasRight = node.right !== undefined;
    if (!hasLeft && !hasRight) return node.label;
    if (!hasRight) return `${node.label} (${render(node.left)})`;
    const left = hasLeft ? render(node.left) : "";
    return `${node.label} (${left}) (${render(node.right)})`;
  };
  return tree.root === undefined ? "" : render(tree.root);
};

// --- layout --------------------------------------------------------------

export type LayoutNode = { id: string; label: string; x: number; y: number };
export type LayoutSlot = {
  parentId: string | null;
  side: "left" | "right" | "root";
  x: number;
  y: number;
};
export type Layout = { nodes: LayoutNode[]; slots: LayoutSlot[]; depth: number };

/**
 * Where every place — and every empty child a place could still grow — sits
 * on the diagram, as a fraction of it in each direction.
 *
 * `x` comes from an in-order walk, counting an empty child as a leaf of its
 * own: that is the standard way to draw a binary tree without branches
 * crossing, and it is what gives an empty slot a sensible position next to
 * its siblings rather than one guessed at. `y` comes straight from depth.
 * Never pixels — the diagram is drawn at whatever size it is given.
 */
export const layoutTree = (
  nodes: TreeNode[],
  root: string | undefined,
  /** Whether to leave room for, and report, the empty places a key could be
   *  inserted at. Only "insert" wants them; anywhere else they would spread
   *  the tree out for places nobody can use. */
  withSlots = true,
): Layout => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  type Entry =
    | { kind: "node"; id: string; label: string; depth: number }
    | { kind: "slot"; parentId: string | null; side: "left" | "right" | "root"; depth: number };
  const entries: Entry[] = [];
  let maxDepth = 0;

  const walk = (id: string | undefined, parentId: string | null, side: "left" | "right", depth: number) => {
    if (id === undefined) {
      if (!withSlots) return;
      maxDepth = Math.max(maxDepth, depth);
      entries.push({ kind: "slot", parentId, side, depth });
      return;
    }
    maxDepth = Math.max(maxDepth, depth);
    const node = byId.get(id);
    if (!node) return; // a dangling reference: nothing sound to lay out
    walk(node.left, id, "left", depth + 1);
    entries.push({ kind: "node", id, label: node.label, depth });
    walk(node.right, id, "right", depth + 1);
  };

  if (root === undefined) {
    entries.push({ kind: "slot", parentId: null, side: "root", depth: 0 });
  } else {
    const node = byId.get(root);
    if (node) {
      walk(node.left, root, "left", 1);
      entries.push({ kind: "node", id: root, label: node.label, depth: 0 });
      walk(node.right, root, "right", 1);
    }
  }

  const count = entries.length;
  const layout: Layout = { nodes: [], slots: [], depth: maxDepth };
  entries.forEach((entry, index) => {
    const x = (index + 0.5) / count;
    const y = (entry.depth + 0.5) / (maxDepth + 1);
    if (entry.kind === "node") {
      layout.nodes.push({ id: entry.id, label: entry.label, x, y });
    } else {
      layout.slots.push({ parentId: entry.parentId, side: entry.side, x, y });
    }
  });
  return layout;
};
