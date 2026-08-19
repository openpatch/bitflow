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
import styles from "./task-code-trace.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-code-trace";

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
    language: "",
    code: "",
    showLineNumbers: true,
    columns: [],
    checkpoints: [],
    caseSensitive: false,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  allCorrect,
  cellCorrect,
  cellStates,
  evaluate,
  normalise,
  scoreOf,
  type CellStates,
} from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export {
  AnswerSchema,
  CheckpointSchema,
  COLUMN_KINDS,
  ColumnKindSchema,
  ColumnSchema,
  DataSchema,
  cellValue,
  linesOf,
  withCell,
  type Answer,
  type CellState,
  type Checkpoint,
  type Column,
  type ColumnKind,
  type Data,
} from "./schema";
export { CodeListing, TraceTable } from "./Trace";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-code-trace", styles);
