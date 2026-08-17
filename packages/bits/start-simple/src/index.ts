import { registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import "./start-simple.css";
import { messages } from "./messages";
import { DataSchema, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "start-simple";

registerBit<Data, never>({
  type: TYPE,
  kind: "start",
  schema: DataSchema,
  Task,
  Form,
  info: (locale) => ({
    name: translate(messages, "name", locale),
    description: translate(messages, "description", locale),
  }),
  defaultData: () => ({ title: "", markdown: "" }),
});

defineBitElement(TYPE);

export { DataSchema, Form, messages, Task, type Data };
