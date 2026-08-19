import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import styles from "./task-free-text.css?inline";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-free-text", styles);

export const TYPE = "task-free-text";

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
    placeholder: "",
    marking: "person" as const,
    minimumLength: 0,
    maximumLength: 0,
    criteria: [],
    modelAnswer: "",
    caseSensitive: false,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  type Answer,
  type Criterion,
  type Data,
} from "./schema";
