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
import styles from "./task-array-steps.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-array-steps";

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
    initial: [],
    steps: [],
    mode: "rearrange",
    showIndices: true,
    caseSensitive: false,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  cellDiffs,
  evaluate,
  normaliseCell,
  rowCorrect,
  stepStates,
  trimTrailingBlanks,
  type RowState,
  type StepState,
} from "./evaluate";
export { formMessages } from "./formMessages";
export { InitialRow, StepsGrid } from "./Grid";
export { messages };
export {
  AnswerSchema,
  carryForward,
  DataSchema,
  displayRow,
  isPermutationOf,
  MODES,
  ModeSchema,
  rowAt,
  slotCountOf,
  StepSchema,
  withRow,
  type Answer,
  type Data,
  type Mode,
  type Step,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-array-steps", styles);
