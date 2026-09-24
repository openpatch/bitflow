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
import styles from "./task-binary-tree.css?inline";
import { Form, Task } from "./views";

export const TYPE = "task-binary-tree";

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
    mode: "traversal",
    traversal: "inorder",
    tree: { nodes: [], root: undefined },
    searchKey: "",
    insertKeys: [],
    partialCredit: true,
    evaluation: defaultEvaluation(),
  }),
});

defineBitElement(TYPE);

export { evaluate, REASONS, type PlacementState, type Reason } from "./evaluate";
export { formMessages } from "./formMessages";
export { messages };
export {
  AnswerSchema,
  DataSchema,
  MODES,
  ModeSchema,
  nameOf,
  nodeById,
  PlacementSchema,
  TRAVERSAL_KINDS,
  TraversalKindSchema,
  TreeNodeSchema,
  TreeSchema,
  type Answer,
  type Data,
  type Mode,
  type Placement,
  type TraversalKind,
  type Tree,
  type TreeNode,
} from "./schema";
export {
  buildBstFromKeys,
  compareKeys,
  expectedPlacements,
  isBst,
  isNumericMode,
  layoutTree,
  parseKeyList,
  parseTreeText,
  searchPath,
  traversalOrder,
  treeToText,
  treeWithPlacements,
  type Layout,
  type ParseResult,
} from "./tree";
export { TreeView, type TreeViewProps } from "./TreeView";
export { Form, Task } from "./views";

injectStyles("bitflow-styles-task-binary-tree", styles);
