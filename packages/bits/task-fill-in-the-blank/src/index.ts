import { registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import "./task-fill-in-the-blank.css";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-fill-in-the-blank";

registerBit<Data, Answer>({
  type: TYPE,
  kind: "task",
  schema: DataSchema,
  evaluate,
  Task,
  Form,
  info: (locale) => ({
    name: translate(messages, "name", locale),
    description: translate(messages, "description", locale),
  }),
  defaultData: () => ({
    instruction: "",
    text: "",
    blanks: {},
    caseSensitive: false,
    trim: true,
    partialCredit: true,
    evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, messages, Task };
export {
  AnswerSchema,
  BLANK_PATTERN,
  blankIdsIn,
  DataSchema,
  type Answer,
  type BlankState,
  type Data,
} from "./schema";
