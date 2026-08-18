import {defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-highlighting.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-highlighting";

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
    text: "",
    colors: { yellow: { enabled: true, label: "" } },
    reference: [],
    cutoffs: { yellow: 0.6 },
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { agreementPerColor, kappa } from "./evaluate";
export { Highlighter, tokenize, type Token } from "./Highlighter";
export {
  AnswerSchema,
  COLORS,
  DataSchema,
  type Answer,
  type Color,
  type Data,
  type Highlights,
} from "./schema";

injectStyles("bitflow-styles-task-highlighting", styles);
