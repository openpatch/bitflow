import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-mouse-accuracy.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-mouse-accuracy";

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
    targets: [],
    aspectRatio: 0.6,
    scoring: "hits",
    allowanceMs: 2000,
    allowOptOut: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, outcomes, scoreOf, summary, type RoundOutcome } from "./evaluate";
export { Arena } from "./Arena";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  RoundSchema,
  ScoringSchema,
  TargetSchema,
  distanceBetween,
  indexOfDifficulty,
  type Answer,
  type Data,
  type Round,
  type Scoring,
  type Target,
} from "./schema";

injectStyles("bitflow-styles-task-mouse-accuracy", styles);
