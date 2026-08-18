import {defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-input.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-input", styles);

export const TYPE = "task-input";

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
    matchMode: "exact",
    expected: [""],
    pattern: "",
    caseSensitive: false,
    trim: true,
    multiline: false,
    evaluation: defaultEvaluation(),
    patternFeedback: [],
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { AnswerSchema, DataSchema, type Answer, type Data } from "./schema";
