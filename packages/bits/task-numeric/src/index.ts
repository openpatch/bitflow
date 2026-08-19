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
import styles from "./task-numeric.css?inline";
import { Form, Task } from "./views";

injectStyles("bitflow-styles-task-numeric", styles);

export const TYPE = "task-numeric";

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
    expected: "",
    tolerance: "exact",
    toleranceValue: 0,
    digits: 2,
    unitMode: "none",
    unit: "",
    unitAlternatives: [],
    scoring: "value",
    decimalSeparator: "both",
    allowExpression: true,
    valueFeedback: [],
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export {
  acceptedRange,
  evaluate,
  read,
  roundToDecimals,
  roundToSignificant,
  unitAccepted,
  withinTolerance,
  type Reading,
} from "./evaluate";
export {
  canonicalUnit,
  CONSTANTS,
  FUNCTIONS,
  MAX_LENGTH,
  parseExpression,
  parseQuantity,
  type DecimalSeparator,
  type ParseFailure,
  type ParseOptions,
  type ParseResult,
  type Quantity,
  type QuantityResult,
} from "./expression";
export {
  AUTHOR_DIGITS,
  formatValue,
  LEARNER_DIGITS,
  NumericField,
} from "./NumericField";
export { formMessages } from "./formMessages";
export { messages };
export { Form, Task } from "./views";
export {
  acceptedUnits,
  AnswerSchema,
  DataSchema,
  ScoringSchema,
  ToleranceModeSchema,
  UnitModeSchema,
  type Answer,
  type Data,
  type Scoring,
  type ToleranceMode,
  type UnitMode,
} from "./schema";
