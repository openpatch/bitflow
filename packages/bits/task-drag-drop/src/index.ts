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
    items: [],
    zones: [],
    allowMultiplePlacements: false,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, zoneStates } from "./evaluate";
export { Board } from "./Board";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  ItemSchema,
  PlacementSchema,
  ZoneSchema,
  type Answer,
  type Data,
  type Item,
  type Placement,
  type Zone,
  type ZoneState,
} from "./schema";

injectStyles("bitflow-styles-task-drag-drop", styles);
