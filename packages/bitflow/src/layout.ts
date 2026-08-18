import { startNodeId, type BitflowDocument, type BitNode } from "@bitflow/core";

/**
 * Positions every step on a grid, top to bottom, in the order a learner meets
 * them.
 *
 * Positions are stored in the document and until now were only ever set by
 * hand, so a flow that arrived from anywhere else — generated, converted,
 * hand-written, or merged from two files — opened as a heap at the origin.
 * Reading the graph then meant untangling it first.
 *
 * A layered layout rather than a force-directed one: an assessment is read in
 * order, and "later is further down" is the only property an author actually
 * wants from the picture. Force-directed layouts optimise for edge length,
 * which produces a pleasant shape that says nothing.
 */

/** Wide enough for the node's `max-width`, plus room for the gap. */
const COLUMN = 280;
const ROW = 140;

/**
 * How far each node is from the start, measured along the *longest* path.
 *
 * Longest rather than shortest so that a node always sits below everything
 * that can reach it: with shortest paths, a step reachable both directly and
 * via a three-step detour would be drawn above its own predecessor, and the
 * edge would run backwards up the canvas.
 *
 * Cycles — a retry loop, an edge back to an earlier question — have no longest
 * path at all, so relaxation is capped at one pass per node. That is enough
 * for any acyclic part and leaves a cycle's nodes at the depth its entry point
 * gave them, which draws the loop as a short backward edge rather than
 * looping forever.
 */
const depths = (doc: BitflowDocument): Map<string, number> => {
  const depth = new Map<string, number>(doc.nodes.map((node) => [node.id, -1]));

  /** Pushes every target below its source until nothing moves. */
  const relax = () => {
    for (let pass = 0; pass < doc.nodes.length; pass++) {
      let changed = false;
      for (const edge of doc.edges) {
        const from = depth.get(edge.source);
        const to = depth.get(edge.target);
        if (from === undefined || to === undefined || from < 0) continue;
        if (to <= from) {
          depth.set(edge.target, from + 1);
          changed = true;
        }
      }
      if (!changed) return;
    }
  };

  const unplaced = () =>
    doc.nodes.filter((node) => (depth.get(node.id) ?? -1) < 0);

  const first = startNodeId(doc);
  if (first) depth.set(first, 0);
  relax();

  /**
   * Whatever the start could not reach is laid out below it, as its own flow.
   *
   * A document being built has disconnected pieces all the time, and stacking
   * them into one row — or worse, on top of the start — is the heap this is
   * meant to replace. Each round seeds the pieces nothing points at and walks
   * down from there, so an orphaned chain keeps its own shape.
   */
  for (let round = 0; round < doc.nodes.length; round++) {
    const remaining = unplaced();
    if (remaining.length === 0) break;

    const below = Math.max(0, ...[...depth.values()]) + 1;
    const roots = remaining.filter(
      (node) =>
        !doc.edges.some(
          (edge) =>
            edge.target === node.id &&
            edge.source !== node.id &&
            remaining.some((other) => other.id === edge.source),
        ),
    );

    // Every remaining node is in a cycle, so none of them is a root: break the
    // tie arbitrarily rather than loop forever.
    for (const node of roots.length > 0 ? roots : remaining.slice(0, 1)) {
      depth.set(node.id, below);
    }
    relax();
  }

  return depth;
};

/**
 * Orders one row by where its predecessors sit in the row above, so branches
 * that split stay side by side instead of crossing. One pass, not the
 * iterative crossing-minimisation a graph library would do: rows here are a
 * handful of nodes wide, and a second pass moves nothing a teacher notices.
 */
const orderRow = (
  row: BitNode[],
  doc: BitflowDocument,
  columnOf: Map<string, number>,
): BitNode[] =>
  [...row]
    .map((node, index) => {
      const sources = doc.edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => columnOf.get(edge.source))
        .filter((column): column is number => column !== undefined);

      return {
        node,
        // No predecessor placed yet: keep the document's own order, which is
        // the order the author added things.
        key: sources.length
          ? sources.reduce((sum, column) => sum + column, 0) / sources.length
          : index,
        index,
      };
    })
    .sort((a, b) => a.key - b.key || a.index - b.index)
    .map(({ node }) => node);

/**
 * The document with every node repositioned. Nothing else is touched — this
 * is a rearrangement, not an edit to the assessment.
 */
export const layout = (doc: BitflowDocument): BitflowDocument => {
  if (doc.nodes.length === 0) return doc;

  const depth = depths(doc);
  const rows = new Map<number, BitNode[]>();
  for (const node of doc.nodes) {
    const row = depth.get(node.id) ?? 0;
    rows.set(row, [...(rows.get(row) ?? []), node]);
  }

  const columnOf = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();

  for (const row of [...rows.keys()].sort((a, b) => a - b)) {
    const ordered = orderRow(rows.get(row)!, doc, columnOf);
    // Centred on x = 0, so a flow that mostly runs straight down stays under
    // its own start rather than drifting right as it branches.
    const offset = ((ordered.length - 1) * COLUMN) / 2;
    ordered.forEach((node, column) => {
      columnOf.set(node.id, column);
      positions.set(node.id, { x: column * COLUMN - offset, y: row * ROW });
    });
  }

  return {
    ...doc,
    nodes: doc.nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
    })),
  };
};
