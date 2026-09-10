import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./start-consent.css?inline";
import { messages } from "./messages";
import { DataSchema, isDecided, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-start-consent", styles);

export const TYPE = "start-consent";

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
  // The one thing that makes this more than a tick box on a page: until they
  // have said either way, the flow will not move.
  isComplete: ({ data, answer }) => isDecided(data, answer),
  defaultData: () => ({
    title: "",
    markdown: "",
    agreeLabel: "",
    requiredHint: "",
    allowDecline: true,
    declineLabel: "",
  }),
});

defineBitElement(TYPE);

export { DataSchema, Form, isDecided, messages, Task, type Answer, type Data };
