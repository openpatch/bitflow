import { injectStyles } from "@bitflow/core";
// React Flow's own stylesheet, injected before ours so the overrides in
// flow.css win. Both travel inside the JavaScript: the canvas is unusable
// without it, and a page cannot be expected to know it needs a third-party
// stylesheet it never imported.
import canvasStyles from "@xyflow/react/dist/style.css?inline";
import styles from "./flow.css?inline";

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
export { EditorNode, nodeTypes } from "./EditorNode";
export {
  FlowEditor,
  type FlowEditorHandle,
  type FlowEditorProps,
} from "./FlowEditor";

injectStyles("bitflow-styles-xyflow", canvasStyles);
injectStyles("bitflow-styles-flow", styles);
