import { injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-choice.css?inline";
import { evaluate } from "./evaluate";
import { Form } from "./Form";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Task } from "./Task";

export const TYPE = "task-choice";

/**
 * Importing this package does both things that make the bit usable: it joins
 * the registry (so a flow can render and grade it) and it defines
 * `<bitflow-task-choice>` (so a plain HTML page can use it on its own). There
 * is no separate "standalone mode" to opt into.
 */
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
    variant: "single",
    choices: [
      { id: "choice-1", markdown: "", correct: true },
      { id: "choice-2", markdown: "", correct: false },
    ],
    shuffle: false,
    partialCredit: false,
    evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
    patternFeedback: [],
  }),
});

defineBitElement(TYPE);

export { evaluate, Form, Task, messages };
export {
  AnswerSchema,
  ChoiceSchema,
  DataSchema,
  type Answer,
  type Choice,
  type ChoiceState,
  type Data,
} from "./schema";

injectStyles("bitflow-styles-task-choice", styles);
