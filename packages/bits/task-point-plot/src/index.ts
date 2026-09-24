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
import styles from "./task-point-plot.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-point-plot";

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
    axes: {
      x: { label: "", min: 0, max: 10 },
      y: { label: "", min: 0, max: 10 },
    },
    classes: [],
    points: [],
    showGrid: true,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { distance, knn, nearestCentroid } from "./classify";
export {
  allCorrect,
  evaluate,
  pointStates,
  scoreOf,
  type PointState,
  type PointStates,
} from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export { PlotView, type PlotViewProps } from "./PlotView";
export {
  AnswerSchema,
  AxesSchema,
  AxisSchema,
  centroids,
  ClassSchema,
  classById,
  classLabel,
  DataSchema,
  knownPoints,
  openPoints,
  PointSchema,
  roleOf,
  SHAPES,
  ShapeSchema,
  type Answer,
  type Axes,
  type Axis,
  type Class,
  type Data,
  type Point,
  type PointRole,
  type Shape,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-point-plot", styles);
