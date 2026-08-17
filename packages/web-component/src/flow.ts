import "@bitflow/bitflow/index.css";
import { defineFlowElement } from "./FlowElement";

/**
 * `<bitflow-flow>` on its own. Loads the learner runtime and nothing else; the
 * bits a document uses arrive as separate chunks when it is loaded.
 */
defineFlowElement();

export { BitflowFlowElement, defineFlowElement } from "./FlowElement";
export { bitLoaders, bitTypesIn, KNOWN_BIT_TYPES, loadBits } from "./bitLoaders";
