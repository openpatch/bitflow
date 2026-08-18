import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-drag-drop.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-drag-drop";

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
    background: { src: "", alt: "" },
    size: { width: 620, height: 310 },
    elements: [],
    dropZones: [],
    singlePoint: false,
    applyPenalties: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, homesOf, judge, maxScore, zoneUnder, type Judged } from "./evaluate";
export { DragCanvas } from "./DragCanvas";
export { EditorCanvas } from "./EditorCanvas";
export { inside, type Box } from "./layout";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  DropZoneSchema,
  ElementSchema,
  PlacementSchema,
  type Answer,
  type Data,
  type DropZone,
  type Element,
  type Placement,
} from "./schema";

injectStyles("bitflow-styles-task-drag-drop", styles);
