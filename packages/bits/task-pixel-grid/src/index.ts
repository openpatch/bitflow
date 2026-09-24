import {
  defaultEvaluation,
  injectStyles,
  registerBit,
  translate,
} from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, DEFAULT_PALETTE, type Answer, type Data } from "./schema";
import styles from "./task-pixel-grid.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-pixel-grid";

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
    rows: 5,
    columns: 5,
    palette: DEFAULT_PALETTE.map((entry) => ({ ...entry })),
    target: Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => DEFAULT_PALETTE[0].id),
    ),
    given: [],
    startColor: DEFAULT_PALETTE[0].id,
    showCoordinates: true,
    showLabels: false,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, scoreOf, wrongCells } from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export { PbmError, parsePbm, type ParsedPbm } from "./pbm";
export { PixelGrid, type PixelGridProps } from "./PixelGrid";
export {
  AnswerSchema,
  blankCells,
  contrastColor,
  DataSchema,
  DEFAULT_PALETTE,
  effectiveCells,
  isGiven,
  paintCell,
  PaletteEntrySchema,
  paletteEntry,
  resizeGrid,
  type Answer,
  type Data,
  type PaletteEntry,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-pixel-grid", styles);
