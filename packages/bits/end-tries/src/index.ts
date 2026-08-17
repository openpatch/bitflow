import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./end-tries.css?inline";
import { messages } from "./messages";
import { DataSchema, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-end-tries", styles);

export const TYPE = "end-tries";

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
    showBreakdown: true,
    showScore: true,
  }),
});

defineBitElement(TYPE);

export { DataSchema, Form, messages, Task, type Data };
