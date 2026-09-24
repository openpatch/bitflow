import {
  defaultEvaluation,
  injectStyles,
  registerBit,
  translate,
} from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { defaultHandles } from "./plot";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import styles from "./task-function-plot.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-function-plot";

const DEFAULT_AXIS = { label: "", min: -5, max: 5, step: 1 };

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
    axes: { x: { ...DEFAULT_AXIS }, y: { ...DEFAULT_AXIS } },
    target: "0",
    shown: [],
    handles: defaultHandles(DEFAULT_AXIS, 5),
    tolerance: DEFAULT_AXIS.step / 2,
    snap: "half",
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { sampleCurve, type CurvePoint, type CurveSegment } from "./curve";
export {
  allCorrect,
  evaluate,
  handleKey,
  handleStates,
  scoreOf,
  type HandleState,
  type HandleStates,
} from "./evaluate";
export {
  describeFormulaError,
  evaluateFormulaAt,
  formulaFn,
  type FormulaError,
  type FormulaResult,
} from "./formula";
export { formMessages } from "./formMessages";
export { messages };
export { PlotView, type PlotViewProps } from "./PlotView";
export {
  defaultHandleValue,
  defaultHandles,
  formatTick,
  keyboardPageStep,
  keyboardStep,
  MARGIN,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  round9,
  snapValue,
  ticksFor,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  xFromView,
  xToView,
  yFromView,
  yToView,
} from "./plot";
export {
  AnswerSchema,
  AxesSchema,
  AxisSchema,
  DataSchema,
  ShownCurveSchema,
  SnapSchema,
  SNAPS,
  type Answer,
  type Axes,
  type Axis,
  type Data,
  type ShownCurve,
  type Snap,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-function-plot", styles);
