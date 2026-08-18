import { defaultEvaluation, injectStyles, registerBit, translate } from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import styles from "./task-word-search.css?inline";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, DIRECTIONS, type Answer, type Data, type Direction } from "./schema";
import { Form, Task } from "./views";

export const TYPE = "task-word-search";

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
    rows: 10,
    columns: 10,
    letters: "",
    words: [],
    directions: Object.keys(DIRECTIONS) as Direction[],
    showWords: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  evaluate,
  foundWords,
  outcomes,
  scoreOf,
  wordFound,
  type WordOutcome,
} from "./evaluate";
export { generate, seededRandom, type Generated, type GenerateOptions } from "./generate";
export { WordGrid } from "./WordGrid";
export { Form, Task } from "./views";
export { messages };
export { formMessages } from "./formMessages";
export {
  AnswerSchema,
  DataSchema,
  DirectionSchema,
  DIRECTIONS,
  SelectionSchema,
  WordSchema,
  cellKey,
  cellsBetween,
  cellsOf,
  letterAt,
  lettersOf,
  type Answer,
  type Data,
  type Direction,
  type Selection,
  type Word,
} from "./schema";

injectStyles("bitflow-styles-task-word-search", styles);
