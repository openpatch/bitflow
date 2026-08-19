import {
  defaultEvaluation,
  injectStyles,
  registerBit,
  translate,
} from "@bitflow/core";
import { defineBitElement } from "@bitflow/element";
import { evaluate } from "./evaluate";
import { messages } from "./messages";
import { DataSchema, type Answer, type Data } from "./schema";
import styles from "./task-math.css?inline";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-math", styles);

export const TYPE = "task-math";

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
    latex: "",
    blanks: {},
    compare: "symbolic",
    tolerance: 0,
    partialCredit: true,
    virtualKeyboard: true,
    blankFeedback: [],
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, type BlankOutcome } from "./evaluate";
export {
  computeEngine,
  matchesAny,
  resetComputeEngine,
  sameMath,
  type ComparisonOptions,
} from "./compare";
export {
  loadMathfield,
  resetMathfield,
  type MathfieldApi,
  type MathfieldModule,
} from "./mathfield";
export { MathAnswer } from "./MathAnswer";
export { formMessages } from "./formMessages";
export { messages };
export { Form, Task } from "./views";
export {
  acceptedFor,
  answerNamesIn,
  AnswerSchema,
  BLANK_PATTERN,
  blankNamesIn,
  BlankSchema,
  CompareModeSchema,
  DataSchema,
  hasBlanks,
  SINGLE_BLANK,
  type Answer,
  type Blank,
  type CompareMode,
  type Data,
} from "./schema";
