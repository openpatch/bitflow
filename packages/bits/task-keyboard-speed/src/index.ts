import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-keyboard-speed.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-keyboard-speed";

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
    scoring: "accuracy",
    requiredAccuracy: 0.95,
    targetWpm: 25,
    timed: true,
    allowOptOut: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, measure, scoreOf, type Measurement } from "./evaluate";
export { Typist } from "./Typist";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  ScoringSchema,
  accuracyOf,
  correctCharacters,
  wordsPerMinute,
  type Answer,
  type Data,
  type Scoring,
} from "./schema";

injectStyles("bitflow-styles-task-keyboard-speed", styles);
