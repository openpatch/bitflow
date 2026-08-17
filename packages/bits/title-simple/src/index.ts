import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./title-simple.css?inline";
import { messages } from "./messages";
import { DataSchema, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-title-simple", styles);

export const TYPE = "title-simple";

registerBit<Data, never>({
  type: TYPE,
  kind: "content",
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
