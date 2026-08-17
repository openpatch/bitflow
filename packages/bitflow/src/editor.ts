import "./flow.css";

/**
 * The authoring half, including the `@xyflow/react` canvas. Separate from the
 * package's main entry so a learner-only page never pays for it.
 */
export { ConditionEditor } from "./ConditionEditor";
export {
  createEditorStore,
  emptyDocument,
  type EditorCallbacks,
  type EditorState,
  type EditorStore,
} from "./editorStore";
export { EditorNode, nodeTypes, summarise } from "./EditorNode";
export {
  FlowEditor,
  type FlowEditorHandle,
  type FlowEditorProps,
} from "./FlowEditor";
