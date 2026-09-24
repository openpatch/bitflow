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
import styles from "./task-table.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-table";

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
    caption: "",
    columns: [],
    rows: [],
    rowHeaders: false,
    rowOrder: "fixed",
    caseSensitive: false,
    ignoreWhitespace: true,
    numberTolerance: 0,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  allCorrect,
  assignMinCost,
  cellCorrect,
  cellStates,
  evaluate,
  matchRows,
  normalise,
  scoreOf,
  type CellState,
  type CellStates,
} from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export { parseDelimited, tableFromPaste } from "./paste";
export {
  AnswerSchema,
  BlankCellSchema,
  CellSchema,
  cellKey,
  COLUMN_KINDS,
  ColumnKindSchema,
  ColumnSchema,
  DataSchema,
  GivenCellSchema,
  isBlankCell,
  isGivenCell,
  ROW_ORDERS,
  RowOrderSchema,
  RowSchema,
  textToAccepted,
  type Answer,
  type BlankCell,
  type Cell,
  type Column,
  type ColumnKind,
  type Data,
  type GivenCell,
  type Row,
  type RowOrder,
} from "./schema";
export { FillableTable, TableEditor } from "./Table";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-table", styles);
