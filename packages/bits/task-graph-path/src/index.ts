import {
  defaultEvaluation,
  injectStyles,
  registerBit,
  translate,
} from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import styles from "./task-graph-path.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-graph-path";

registerBit<Data, Answer>({
  type: TYPE,
  kind: "task",
  schema: DataSchema,
  evaluate,
  Task,
  Form,
  info: (locale) => ({
    name: translate(messages, "name", locale),
    description: translate(messages, "description", locale),
  }),
  defaultData: () => ({
    instruction: "",
    directed: false,
    weighted: false,
    nodes: [],
    edges: [],
    goal: "shortestPath" as const,
    sourceId: "",
    targetId: "",
    traversal: "bfs" as const,
    neighbourOrder: "label" as const,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, judge, REASONS, type Reason, type Verdict } from "./evaluate";
export { formMessages } from "./formMessages";
export {
  breakIn,
  costOf,
  cutCost,
  distancesFrom,
  edgeBetween,
  EPSILON,
  minimumCutCost,
  neighboursOf,
  reaches,
  routeCost,
  routeEdges,
  sameCost,
  spanningTreeCost,
  traversalOrder,
  treeCost,
  treeShape,
  isRoute,
  type TreeShape,
} from "./graph";
export { GraphView, VIEW_HEIGHT, VIEW_WIDTH, edgeName } from "./GraphView";
export { messages };
export {
  AnswerSchema,
  DataSchema,
  EdgeSchema,
  GOALS,
  GoalSchema,
  NeighbourOrderSchema,
  NodeSchema,
  TraversalSchema,
  answerOf,
  edgeById,
  isSequence,
  nameOf,
  needsSource,
  needsTarget,
  nodeById,
  picks,
  withAnswer,
  type Answer,
  type Data,
  type Goal,
  type GraphEdge,
  type GraphNode,
  type NeighbourOrder,
  type Traversal,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-graph-path", styles);
