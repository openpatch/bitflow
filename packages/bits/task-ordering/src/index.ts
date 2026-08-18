import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-ordering.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-ordering";

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
    items: [],
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { correctPositions, evaluate } from "./evaluate";
export { seededShuffle, shuffledAwayFrom } from "./shuffle";
export { Sequence } from "./Sequence";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  ItemSchema,
  type Answer,
  type Data,
  type Item,
} from "./schema";

injectStyles("bitflow-styles-task-ordering", styles);
