import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./end-handoff.css?inline";
import { messages } from "./messages";
import {
  DataSchema,
  isSendableOrigin,
  MESSAGE_TYPE,
  type Data,
} from "./schema";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-end-handoff", styles);

export const TYPE = "end-handoff";

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
    // Off, and with no address: a bit that shipped ready to post the attempt
    // somewhere would only ever be pointed somewhere by accident.
    postMessage: false,
    messageOrigin: "",
    continueUrl: "",
    continueLabel: "",
  }),
});

defineBitElement(TYPE);

export {
  DataSchema,
  Form,
  isSendableOrigin,
  MESSAGE_TYPE,
  messages,
  Task,
  type Data,
};
