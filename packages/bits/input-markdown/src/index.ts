import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./input-markdown.css?inline";
import { messages } from "./messages";
import { DataSchema, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-input-markdown", styles);

export const TYPE = "input-markdown";

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
  defaultData: () => ({ markdown: "" }),
});

defineBitElement(TYPE);

export { DataSchema, Form, messages, Task, type Data };
