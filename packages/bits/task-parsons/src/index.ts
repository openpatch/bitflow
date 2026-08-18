import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-parsons.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-parsons";

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
    language: "",
    lines: [],
    indentationMatters: false,
    penaliseDistractors: false,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, outcomes, solutionOf, type LineOutcome } from "./evaluate";
export { seededShuffle, shuffledAwayFrom } from "./shuffle";
export { Puzzle } from "./Puzzle";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  LineSchema,
  PlacedLineSchema,
  type Answer,
  type Data,
  type Line,
  type PlacedLine,
} from "./schema";

injectStyles("bitflow-styles-task-parsons", styles);
