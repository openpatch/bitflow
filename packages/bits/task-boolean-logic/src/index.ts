import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import styles from "./task-boolean-logic.css?inline";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-boolean-logic", styles);

export const TYPE = "task-boolean-logic";

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
    variables: ["A", "B"],
    columns: [],
    rowOrder: "standard" as const,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export { formMessages } from "./formMessages";
export { format, parse, valueOf, variablesIn } from "./expression";
export {
  AnswerSchema,
  DataSchema,
  rowsOf,
  type Answer,
  type Column,
  type Data,
  type Expression,
} from "./schema";
