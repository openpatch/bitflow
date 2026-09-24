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
import styles from "./task-cardinality.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-cardinality";

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
    notation: "chen",
    entities: [],
    relationships: [],
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { Diagram, relationshipName } from "./Diagram";
export { endStates, evaluate, sameLabel, type EndStates } from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export {
  AnswerSchema,
  DataSchema,
  endKey,
  EntitySchema,
  labelsOf,
  NOTATIONS,
  NotationSchema,
  RelationshipSchema,
  type Answer,
  type Data,
  type End,
  type Entity,
  type Notation,
  type Relationship,
} from "./schema";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-cardinality", styles);
