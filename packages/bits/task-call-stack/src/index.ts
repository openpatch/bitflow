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
import styles from "./task-call-stack.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-call-stack";

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
    code: "",
    showLineNumbers: true,
    showLocals: false,
    checkpoints: [],
    caseSensitive: false,
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, frameCorrect, normalise, stackStates, type StackState } from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export {
  AnswerSchema,
  carriedStack,
  CheckpointSchema,
  DataSchema,
  FrameSchema,
  linesOf,
  withStack,
  type Answer,
  type Checkpoint,
  type Data,
  type Frame,
} from "./schema";
export { CodeListing, Stacks } from "./Stacks";
export { Form, framesToText, Task, textToFrames } from "./views";

injectStyles("bitflow-styles-task-call-stack", styles);
