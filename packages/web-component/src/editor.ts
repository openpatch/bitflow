import { defineEditorElement } from "./EditorElement";

/** `<bitflow-flow-editor>` on its own, with the whole palette. */
defineEditorElement();

export { BitflowEditorElement, defineEditorElement } from "./EditorElement";
export { loadAllBits } from "./bitLoaders";
