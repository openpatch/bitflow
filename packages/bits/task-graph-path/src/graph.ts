import type { Data, GraphEdge } from "./schema";

/**
 * The graph algorithms, in the browser and nowhere else.
 *
 * Every one of them is a few lines over the authored graph — Dijkstra,
 * breadth- and depth-first search, Kruskal and a max-flow — which is why these
 * tasks can be marked without an answer key: the cost of the best answer is
 * computed rather than stored, so any equally good alternative is right without
 * the author having thought of it.
 *
 * Graphs here are small by schema (30 places, 90 connections), so the plain
 * O(V²) and O(V·E²) versions are used. They are shorter, and short is what can
 * be checked by reading.
 */

/** What an edge costs. One apiece unless the graph is weighted. */
export const costOf = (data: Data, edge: GraphEdge): number =>
  data.weighted ? edge.weight : 1;

/** Weights are author-entered decimals, so costs are compared with a margin. */
export const EPSILON = 1e-9;

export const sameCost = (a: number, b: number): boolean =>
  Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b));

/** The edge joining two places in that direction, if there is one. */
export const edgeBetween = (
  data: Data,
  from: string,
  to: string,
): GraphEdge | undefined =>
  data.edges.find(
    (edge) =>
      (edge.source === from && edge.target === to) ||
      (!data.directed && edge.source === to && edge.target === from),
  );

/**
 * Where you can go from a place, in the order the authored rule says to
 * consider them.
 *
 * The rule is part of the question: a traversal has one right order only once
 * it is settled how a search chooses between two neighbours.
 */
export const neighboursOf = (data: Data, from: string): string[] => {
  const found: { id: string; edge: number }[] = [];

  data.edges.forEach((edge, index) => {
    if (edge.source === from) found.push({ id: edge.target, edge: index });
    else if (!data.directed && edge.target === from) {
      found.push({ id: edge.source, edge: index });
    }
  });

  if (data.neighbourOrder === "authored") {
    return found.sort((a, b) => a.edge - b.edge).map((entry) => entry.id);
  }

  const label = (id: string) =>
    data.nodes.find((node) => node.id === id)?.label ?? id;
  // A plain comparison rather than `localeCompare`: the order a mark depends on
  // must not change with the reader's locale.
  return found
    .sort((a, b) => {
      const left = label(a.id);
      const right = label(b.id);
      if (left === right) return a.edge - b.edge;
      return left < right ? -1 : 1;
    })
    .map((entry) => entry.id);
};

/** Cheapest cost from `source` to everywhere reachable. */
export const distancesFrom = (data: Data, source: string): Map<string, number> => {
  const distance = new Map<string, number>([[source, 0]]);
  const settled = new Set<string>();

  for (;;) {
    let next: string | undefined;
    let best = Infinity;
    for (const [id, value] of distance) {
      if (!settled.has(id) && value < best) {
        best = value;
        next = id;
      }
    }
    if (next === undefined) return distance;
    settled.add(next);

    for (const to of neighboursOf(data, next)) {
      const edge = edgeBetween(data, next, to);
      if (!edge) continue;
      const through = best + costOf(data, edge);
      if (through < (distance.get(to) ?? Infinity)) distance.set(to, through);
    }
  }
};

/** The places a search visits, in order, from `source`. */
export const traversalOrder = (data: Data, source: string): string[] => {
  const order: string[] = [];
  const seen = new Set<string>();

  if (data.traversal === "bfs") {
    const queue = [source];
    seen.add(source);
    while (queue.length > 0) {
      const at = queue.shift() as string;
      order.push(at);
      for (const to of neighboursOf(data, at)) {
        if (seen.has(to)) continue;
        seen.add(to);
        queue.push(to);
      }
    }
    return order;
  }

  // Depth first, iteratively: neighbours are pushed in reverse so the first one
  // by the authored rule comes off the stack first, which is the order the
  // recursive version visits them in.
  const stack = [source];
  while (stack.length > 0) {
    const at = stack.pop() as string;
    if (seen.has(at)) continue;
    seen.add(at);
    order.push(at);
    const next = neighboursOf(data, at);
    for (let i = next.length - 1; i >= 0; i--) {
      if (!seen.has(next[i])) stack.push(next[i]);
    }
  }
  return order;
};

/** Whether a sequence of places is a route: joined up, and no place twice. */
export const isRoute = (data: Data, nodeIds: string[]): boolean => {
  if (nodeIds.length < 2) return false;
  if (new Set(nodeIds).size !== nodeIds.length) return false;
  return nodeIds.every(
    (id, index) => index === 0 || edgeBetween(data, nodeIds[index - 1], id) !== undefined,
  );
};

/** The first place a route stops being joined up, or `undefined`. */
export const breakIn = (data: Data, nodeIds: string[]): number | undefined => {
  for (let index = 1; index < nodeIds.length; index++) {
    if (!edgeBetween(data, nodeIds[index - 1], nodeIds[index])) return index;
  }
  return undefined;
};

/** What a route costs. `undefined` where it is not a route at all. */
export const routeCost = (data: Data, nodeIds: string[]): number | undefined => {
  let total = 0;
  for (let index = 1; index < nodeIds.length; index++) {
    const edge = edgeBetween(data, nodeIds[index - 1], nodeIds[index]);
    if (!edge) return undefined;
    total += costOf(data, edge);
  }
  return total;
};

/** The edges a route uses, in order. */
export const routeEdges = (data: Data, nodeIds: string[]): string[] => {
  const used: string[] = [];
  for (let index = 1; index < nodeIds.length; index++) {
    const edge = edgeBetween(data, nodeIds[index - 1], nodeIds[index]);
    if (edge) used.push(edge.id);
  }
  return used;
};

// --- spanning trees ---------------------------------------------------------

const find = (parent: Map<string, string>, id: string): string => {
  let at = id;
  while (parent.get(at) !== at) at = parent.get(at) as string;
  return at;
};

/**
 * The cost of a cheapest spanning tree, or `undefined` when the graph is not
 * all one piece and so has none.
 *
 * Kruskal, with edges sorted by cost and then by id: two edges of the same cost
 * are interchangeable for the total, and the tie-break only keeps the walk
 * deterministic.
 */
export const spanningTreeCost = (data: Data): number | undefined => {
  const parent = new Map(data.nodes.map((node) => [node.id, node.id]));
  const sorted = [...data.edges].sort((a, b) => {
    const cost = costOf(data, a) - costOf(data, b);
    return cost !== 0 ? cost : a.id < b.id ? -1 : 1;
  });

  let total = 0;
  let joined = 0;
  for (const edge of sorted) {
    const left = find(parent, edge.source);
    const right = find(parent, edge.target);
    if (left === right) continue;
    parent.set(left, right);
    total += costOf(data, edge);
    joined += 1;
  }

  return joined === data.nodes.length - 1 ? total : undefined;
};

export type TreeShape = "tree" | "cycle" | "disconnected" | "wrongSize";

/**
 * Whether a set of edges is a spanning tree, and if not, what is wrong with it.
 *
 * Told apart because the mistakes are different: a set with a cycle in it has
 * one edge too many somewhere, and one that leaves a place out has one too few.
 */
export const treeShape = (data: Data, edgeIds: string[]): TreeShape => {
  const chosen = data.edges.filter((edge) => edgeIds.includes(edge.id));
  if (chosen.length !== data.nodes.length - 1) return "wrongSize";

  const parent = new Map(data.nodes.map((node) => [node.id, node.id]));
  for (const edge of chosen) {
    const left = find(parent, edge.source);
    const right = find(parent, edge.target);
    if (left === right) return "cycle";
    parent.set(left, right);
  }

  const roots = new Set(data.nodes.map((node) => find(parent, node.id)));
  return roots.size === 1 ? "tree" : "disconnected";
};

export const treeCost = (data: Data, edgeIds: string[]): number =>
  data.edges
    .filter((edge) => edgeIds.includes(edge.id))
    .reduce((total, edge) => total + costOf(data, edge), 0);

// --- cuts -------------------------------------------------------------------

/**
 * What it costs to separate a set of places from the rest: the connections
 * leaving it.
 *
 * An undirected connection counts once whichever way round its endpoints are;
 * a directed one only counts when it points out of the set, which is what makes
 * this the same number a max-flow computes.
 */
export const cutCost = (data: Data, side: string[]): number => {
  const inside = new Set(side);
  return data.edges.reduce((total, edge) => {
    const from = inside.has(edge.source);
    const to = inside.has(edge.target);
    if (data.directed) return total + (from && !to ? costOf(data, edge) : 0);
    return total + (from !== to ? costOf(data, edge) : 0);
  }, 0);
};

/**
 * The cost of the cheapest cut separating two places, by max-flow.
 *
 * Edmonds–Karp: augment along the shortest residual route until there is none.
 * An undirected connection becomes a pair of arcs of its own cost, which is the
 * standard reading of an undirected cut, and the iteration cap is there so a
 * pathological set of decimal weights cannot spin.
 */
export const minimumCutCost = (
  data: Data,
  source: string,
  target: string,
): number | undefined => {
  if (source === target) return undefined;

  const capacity = new Map<string, Map<string, number>>();
  const ensure = (id: string) => {
    if (!capacity.has(id)) capacity.set(id, new Map());
    return capacity.get(id) as Map<string, number>;
  };
  data.nodes.forEach((node) => ensure(node.id));
  for (const edge of data.edges) {
    const cost = costOf(data, edge);
    const forward = ensure(edge.source);
    forward.set(edge.target, (forward.get(edge.target) ?? 0) + cost);
    const backward = ensure(edge.target);
    if (data.directed) {
      backward.set(edge.source, backward.get(edge.source) ?? 0);
    } else {
      backward.set(edge.source, (backward.get(edge.source) ?? 0) + cost);
    }
  }

  let flow = 0;
  for (let round = 0; round < 10_000; round++) {
    // Shortest augmenting route by breadth-first search over the residuals.
    const cameFrom = new Map<string, string>();
    const queue = [source];
    const seen = new Set([source]);
    while (queue.length > 0 && !cameFrom.has(target)) {
      const at = queue.shift() as string;
      for (const [to, left] of capacity.get(at) ?? []) {
        if (seen.has(to) || left <= EPSILON) continue;
        seen.add(to);
        cameFrom.set(to, at);
        queue.push(to);
      }
    }
    if (!cameFrom.has(target)) return flow;

    let spare = Infinity;
    for (let at = target; at !== source; at = cameFrom.get(at) as string) {
      const from = cameFrom.get(at) as string;
      spare = Math.min(spare, capacity.get(from)?.get(at) ?? 0);
    }
    for (let at = target; at !== source; at = cameFrom.get(at) as string) {
      const from = cameFrom.get(at) as string;
      const out = capacity.get(from) as Map<string, number>;
      const back = capacity.get(at) as Map<string, number>;
      out.set(at, (out.get(at) ?? 0) - spare);
      back.set(from, (back.get(from) ?? 0) + spare);
    }
    flow += spare;
  }

  return flow;
};

/** Whether one place can be reached from another at all. */
export const reaches = (data: Data, from: string, to: string): boolean =>
  distancesFrom(data, from).has(to);
