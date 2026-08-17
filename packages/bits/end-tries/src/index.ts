import { registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import "./end-tries.css";
import { messages } from "./messages";
import { DataSchema, type Data } from "./schema";
import { Form, Task } from "./views";

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
