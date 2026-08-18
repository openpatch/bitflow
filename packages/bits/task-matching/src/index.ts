import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-matching.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-matching";

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
    pairs: [],
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, isRight } from "./evaluate";
export { seededShuffle } from "./shuffle";
export { Columns } from "./Columns";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  MatchSchema,
  PairSchema,
  SideSchema,
  type Answer,
  type Data,
  type Match,
  type Pair,
  type Side,
} from "./schema";

injectStyles("bitflow-styles-task-matching", styles);
