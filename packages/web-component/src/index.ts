import { defineEditorElement } from "./EditorElement";
import { defineFlowElement } from "./FlowElement";
import { defineReportElements } from "./ReportElements";

/**
 * Every element in one script, for a page that wants all of them. The
 * per-surface entries (`./flow`, `./editor`, `./report`) exist so a page that
 * does not can avoid the rest.
 */
defineFlowElement();
defineEditorElement();
defineReportElements();

export {
  bitLoaders,
  bitTypesIn,
  KNOWN_BIT_TYPES,
  loadAllBits,
  loadBits,
} from "./bitLoaders";
export { BitflowEditorElement, defineEditorElement } from "./EditorElement";
export { BitflowFlowElement, defineFlowElement } from "./FlowElement";
export { defineReportElements } from "./ReportElements";
