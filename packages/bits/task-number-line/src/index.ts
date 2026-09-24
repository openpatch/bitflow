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
import styles from "./task-number-line.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-number-line";

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
  defaultData: () => {
    const tickStep = 1;
    return {
      instruction: "",
      min: -2,
      max: 2,
      tickStep,
      minorTicks: 0,
      labelTicks: true,
      items: [],
      // Stored explicitly rather than left for a schema default: the
      // sensible value depends on `tickStep`, which no default declared on
      // the `tolerance` field itself could read. See the comment on
      // `DataSchema` in `schema.ts`.
      tolerance: tickStep / 4,
      snap: "minor",
      partialCredit: true,
      evaluation: defaultEvaluation(),
    };
  },
});

defineBitElement(TYPE);

export { evaluate, itemStates, allCorrect, scoreOf, type ItemState, type ItemStates } from "./evaluate";
export { formMessages } from "./formMessages";
export {
  formatValue,
  keyboardStepFor,
  LINE_Y,
  MARGIN,
  minorStepFor,
  PLOT_WIDTH,
  snapStepFor,
  snapValue,
  stackLabels,
  ticksFor,
  valueToView,
  viewToValue,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  type Ticks,
} from "./line";
export { messages };
export { NumberLineView, type NumberLineViewProps } from "./NumberLineView";
export {
  AnswerSchema,
  DataSchema,
  ItemSchema,
  lineTolerance,
  SNAP_MODES,
  SnapModeSchema,
  toleranceFor,
  type Answer,
  type Data,
  type Item,
  type SnapMode,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-number-line", styles);
