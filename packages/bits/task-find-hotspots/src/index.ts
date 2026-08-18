import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-find-hotspots.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-find-hotspots";

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
    hotspots: [],
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate } from "./evaluate";
export { centreOf, contains, hotspotAt, type Box } from "./geometry";
export { HotspotCanvas } from "./HotspotCanvas";
export { Picture } from "./Picture";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  HotspotSchema,
  type Answer,
  type Data,
  type Hotspot,
} from "./schema";

injectStyles("bitflow-styles-task-find-hotspots", styles);
