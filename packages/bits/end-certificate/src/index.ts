import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./end-certificate.css?inline";
import { messages } from "./messages";
import { DataSchema, finishedAt, nameIn, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-end-certificate", styles);

export const TYPE = "end-certificate";

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
    issuer: "",
    showName: true,
    showScore: true,
    showDate: true,
    printLabel: "",
  }),
});

defineBitElement(TYPE);

export {
  DataSchema,
  finishedAt,
  Form,
  messages,
  nameIn,
  Task,
  type Data,
};
