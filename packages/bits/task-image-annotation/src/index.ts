import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import styles from "./task-image-annotation.css?inline";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-image-annotation", styles);

export const TYPE = "task-image-annotation";

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
    annotationKind: "point" as const,
    maximumCount: 1,
    requireLabel: false,
    regions: [],
    overlap: 0.5,
    penaliseExtras: false,
    caseSensitive: false,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { formMessages } from "./formMessages";
export { lands, named, overlapOf, within } from "./geometry";
export {
  AnswerSchema,
  DataSchema,
  type Annotation,
  type Answer,
  type Data,
  type Region,
} from "./schema";
