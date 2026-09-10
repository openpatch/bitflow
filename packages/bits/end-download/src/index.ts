import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./end-download.css?inline";
import { messages } from "./messages";
import { DataSchema, filenameOf, payloadOf, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-end-download", styles);

export const TYPE = "end-download";

registerBit<Data, never>({
  type: TYPE,
  kind: "end",
  schema: DataSchema,
  Task,
  Form,
  info: (locale) => ({
    name: translate(messages, "name", locale),
    description: translate(messages, "description", locale),
  }),
  defaultData: () => ({
    title: "",
    markdown: "",
    buttonLabel: "",
    filename: "attempt",
    includeAnswers: true,
  }),
});

defineBitElement(TYPE);

export {
  DataSchema,
  filenameOf,
  Form,
  messages,
  payloadOf,
  Task,
  type Data,
};
