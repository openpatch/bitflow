import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-crossword.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-crossword";

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
    words: [],
    scoring: "words",
    penaliseWrong: false,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  cellOutcome,
  evaluate,
  letterAt,
  outcomes,
  scoreOf,
  type CellOutcome,
  type WordOutcome,
} from "./evaluate";
export { cluesOf, gridOf, pathOf, type Cell, type Grid, type NumberedWord } from "./grid";
export { layout, type Layout } from "./layout";
export { Crossword } from "./Crossword";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  OrientationSchema,
  ScoringSchema,
  WordSchema,
  cellKey,
  cellsOf,
  lettersOf,
  normalise,
  type Answer,
  type Data,
  type Orientation,
  type Scoring,
  type Word,
} from "./schema";

injectStyles("bitflow-styles-task-crossword", styles);
