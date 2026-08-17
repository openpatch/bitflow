import { registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import "./task-yes-no.css";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-yes-no";

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
    question: "",
    correctAnswer: true,
    evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { AnswerSchema, DataSchema, type Answer, type Data } from "./schema";
