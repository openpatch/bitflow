import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A graph, and something to pick out of it: a route, a traversal order, a
 * cheapest spanning tree, or a cut.
 *
 * All five are one bit because they are one answer — a set or a sequence of
 * node and edge ids — and because they are marked the same way: by running the
 * algorithm over the authored graph in the browser and comparing the *cost* of
 * what the learner chose with the cost of the best there is. That is what lets
 * an equally good alternative be right without the author listing it, which is
 * the whole difficulty with these questions on paper.
 */

export const NodeSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same place. */
  id: z.string().min(1),
  label: z.string().default(""),
  /**
   * Where it sits, as a fraction of the diagram in each direction. Never
   * pixels: the diagram is drawn at whatever size it is given.
   */
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
});
export type GraphNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  /** Ignored entirely unless the graph is weighted, where it is the cost. */
  weight: z.number().positive().default(1),
});
export type GraphEdge = z.infer<typeof EdgeSchema>;

/**
 * What the learner is asked for.
 *
 * - `path` — any route from one place to another.
 * - `shortestPath` — the cheapest such route; ties are all correct.
 * - `traversal` — the order a breadth- or depth-first search visits places in.
 * - `spanningTree` — a cheapest set of edges joining everything up.
 * - `cut` — a cheapest set of edges whose removal separates two places, given
 *   as the places left on the near side.
 */
export const GOALS = [
  "path",
  "shortestPath",
  "traversal",
  "spanningTree",
  "cut",
] as const;
export const GoalSchema = z.enum(GOALS);
export type Goal = z.infer<typeof GoalSchema>;

export const TraversalSchema = z.enum(["bfs", "dfs"]);
export type Traversal = z.infer<typeof TraversalSchema>;

/**
 * How ties are broken when a search has a choice of neighbours.
 *
 * A traversal order is only one order if the rule for choosing between
 * neighbours is stated, so it is authored and shown to the learner rather than
 * left to whatever the implementation happens to do. "In alphabetical order of
 * their label" is how it is taught; "in the order the author drew them" is what
 * a textbook diagram with numbered edges means.
 */
export const NeighbourOrderSchema = z.enum(["label", "authored"]);
export type NeighbourOrder = z.infer<typeof NeighbourOrderSchema>;

/** Which goals name a start and a finish. */
export const needsTarget = (goal: Goal): boolean =>
  goal === "path" || goal === "shortestPath" || goal === "cut";

/** Which goals name a start at all. */
export const needsSource = (goal: Goal): boolean => goal !== "spanningTree";

/** Which goals are answered by a sequence of nodes rather than a set. */
export const isSequence = (goal: Goal): boolean =>
  goal === "path" || goal === "shortestPath" || goal === "traversal";

/** What the learner picks: places, or connections. */
export const picks = (goal: Goal): "nodes" | "edges" =>
  goal === "spanningTree" ? "edges" : "nodes";

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    directed: z.boolean().default(false),
    /** Off, every edge costs one, and the weights are neither shown nor used. */
    weighted: z.boolean().default(false),
    nodes: z.array(NodeSchema).max(30).default([]),
    edges: z.array(EdgeSchema).max(90).default([]),
    goal: GoalSchema.default("shortestPath"),
    sourceId: z.string().default(""),
    targetId: z.string().default(""),
    traversal: TraversalSchema.default("bfs"),
    neighbourOrder: NeighbourOrderSchema.default("label"),
    /**
     * Only a traversal can be partly right in a way worth a mark: the order is
     * right up to the point it goes wrong. A route that does not arrive and a
     * tree that is not a tree are wrong outright, so this does nothing there.
     */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { nodes, edges, goal, sourceId, targetId, directed } = ctx.value;

    const ids = nodes.map((node) => node.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: nodes,
        path: ["nodes"],
        message: "Each place needs its own id.",
      });
    }

    const edgeIds = edges.map((edge) => edge.id);
    if (new Set(edgeIds).size !== edgeIds.length) {
      ctx.issues.push({
        code: "custom",
        input: edges,
        path: ["edges"],
        message: "Each connection needs its own id.",
      });
    }

    const seen = new Set<string>();
    edges.forEach((edge, index) => {
      if (!ids.includes(edge.source) || !ids.includes(edge.target)) {
        ctx.issues.push({
          code: "custom",
          input: edge,
          path: ["edges", index],
          message: "A connection has to join two places that exist.",
        });
        return;
      }

      if (edge.source === edge.target) {
        ctx.issues.push({
          code: "custom",
          input: edge,
          path: ["edges", index],
          message: "A connection cannot join a place to itself.",
        });
        return;
      }

      // Two connections between the same pair make "the connection from A to
      // B" ambiguous, and the answer names connections.
      const key = directed
        ? `${edge.source}>${edge.target}`
        : [edge.source, edge.target].sort().join("-");
      if (seen.has(key)) {
        ctx.issues.push({
          code: "custom",
          input: edge,
          path: ["edges", index],
          message: "Those two places are already joined.",
        });
      }
      seen.add(key);
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (nodes.length < 2) {
      ctx.issues.push({
        code: "custom",
        input: nodes,
        path: ["nodes"],
        message: "Add at least two places.",
      });
    }

    if (edges.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: edges,
        path: ["edges"],
        message: "Add at least one connection.",
      });
    }

    nodes.forEach((node, index) => {
      if (node.label.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: node,
          path: ["nodes", index, "label"],
          message: "Give the place a name.",
        });
      }
    });

    if (needsSource(goal) && !ids.includes(sourceId)) {
      ctx.issues.push({
        code: "custom",
        input: sourceId,
        path: ["sourceId"],
        message: "Choose where the answer starts.",
      });
    }

    if (needsTarget(goal)) {
      if (!ids.includes(targetId)) {
        ctx.issues.push({
          code: "custom",
          input: targetId,
          path: ["targetId"],
          message: "Choose where the answer finishes.",
        });
      } else if (targetId === sourceId) {
        ctx.issues.push({
          code: "custom",
          input: targetId,
          path: ["targetId"],
          message: "The start and the finish have to be different places.",
        });
      }
    }

    if (goal === "spanningTree" && directed) {
      // A spanning tree of a directed graph is a different object with a
      // different algorithm; pretending otherwise would mark honest answers
      // wrong.
      ctx.issues.push({
        code: "custom",
        input: directed,
        path: ["directed"],
        message: "A spanning tree needs an undirected graph.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * The places chosen, in order where the order matters: a route, a traversal,
   * or the near side of a cut.
   */
  nodeIds: z.array(z.string()).default([]),
  /** The connections chosen. A spanning tree is the only goal that uses these. */
  edgeIds: z.array(z.string()).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/**
 * Only one of the two lists is ever filled, by the goal, rather than one being
 * derived from the other and stored beside it. A route recorded as both places
 * and connections is a route that can be reloaded disagreeing with itself.
 */
export const answerOf = (goal: Goal, answer?: Answer): string[] =>
  picks(goal) === "edges" ? (answer?.edgeIds ?? []) : (answer?.nodeIds ?? []);

export const withAnswer = (goal: Goal, chosen: string[]): Answer =>
  picks(goal) === "edges"
    ? { nodeIds: [], edgeIds: chosen }
    : { nodeIds: chosen, edgeIds: [] };

export const nodeById = (data: Data, id: string): GraphNode | undefined =>
  data.nodes.find((node) => node.id === id);

export const edgeById = (data: Data, id: string): GraphEdge | undefined =>
  data.edges.find((edge) => edge.id === id);

/** A place's name, or its id where the author has not given it one. */
export const nameOf = (data: Data, id: string): string =>
  nodeById(data, id)?.label || id;
