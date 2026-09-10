import { createId, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./start-identify.css?inline";
import { messages } from "./messages";
import {
  DataSchema,
  identityOf,
  isFilledIn,
  type Answer,
  type Data,
} from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-start-identify", styles);

export const TYPE = "start-identify";

registerBit<Data, Answer>({
  type: TYPE,
  kind: "start",
  schema: DataSchema,
  Task,
  Form,
  info: (locale) => ({
    name: translate(messages, "name", locale),
    description: translate(messages, "description", locale),
  }),
  // Required means required: the flow does not move until they are filled in.
  isComplete: ({ data, answer }) => isFilledIn(data, answer),
  defaultData: (): Data => ({
    title: "",
    markdown: "",
    // One field, already asking for the thing nearly every flow wants. An
    // empty list would hand the author a step that shows nothing.
    fields: [
      {
        id: createId("field"),
        label: "Name",
        hint: "",
        required: true,
        kind: "text",
        options: [],
      },
    ],
  }),
});

defineBitElement(TYPE);

export {
  DataSchema,
  Form,
  identityOf,
  isFilledIn,
  messages,
  Task,
  type Answer,
  type Data,
};
