import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./start-simple.css?inline";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { DataSchema, outlineOf, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-start-simple", styles);

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
  defaultData: () => ({ title: "", markdown: "", showOutline: false }),
});

defineBitElement(TYPE);

export {
  DataSchema,
  Form,
  formMessages,
  messages,
  outlineOf,
  Task,
  type Data,
};
