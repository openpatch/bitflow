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
import styles from "./task-number-representation.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-number-representation";

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
    sourceRepresentation: "decimal" as const,
    sourceValue: "",
    targetRepresentation: "binary" as const,
    bitWidth: 8,
    signed: false,
    allowPrefix: true,
    allowSeparators: true,
    requireFullWidth: true,
    scoring: "answer" as const,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, judge, type Outcome, type Reason } from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export {
  asDecimal,
  digitsNeeded,
  fits,
  RADIX,
  rangeOf,
  read,
  READ_FAILURES,
  REPRESENTATIONS,
  sameValue,
  write,
  type ParseOptions,
  type ReadFailure,
  type Reading,
  type Representation,
} from "./numbers";
export {
  AnswerSchema,
  DataSchema,
  RepresentationSchema,
  ScoringSchema,
  answerOptions,
  expectedValues,
  expectedWritten,
  sourceOptions,
  type Answer,
  type Data,
  type Scoring,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-number-representation", styles);
