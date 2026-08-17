import { conditionNodeIds } from "./condition";
import {
  bitflowError,
  toDiagnostics,
  type Diagnostic,
  type Result,
} from "./errors";
import { incomingEdges, outgoingEdges } from "./engine";
import { getBit, listBits } from "./registry";
import {
  BitflowDocumentSchema,
  type BitflowDocument,
} from "./schema";

export type ValidationResult = {
  valid: boolean;
  diagnostics: Diagnostic[];
};

/**
 * Envelope-level parse. Bit `data` is *not* checked here — a host that has not
 * loaded a bit package must still be able to read, edit and re-save a document
 * containing it. `validateFlow` does the bit-aware pass.
 */
export const parseFlow = (input: unknown): Result<BitflowDocument> => {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (cause) {
      return {
        ok: false,
        error: bitflowError(
          "INVALID_FLOW",
          `The flow is not valid JSON: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
        ),
      };
    }
  }

  const parsed = BitflowDocumentSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_FLOW",
        "The flow does not match the .bitflow schema.",
        toDiagnostics(parsed.error.issues),
      ),
    };
  }
  return { ok: true, value: parsed.data };
};

/**
 * The authoring-time check behind `<bitflow-flow-editor>`'s `validate()`.
 *
 * Every diagnostic carries the path of the field at fault so the editor can
 * put the message next to the input the teacher has to fix.
 */
export const validateFlow = (doc: BitflowDocument): ValidationResult => {
  const diagnostics: Diagnostic[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  doc.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      diagnostics.push({
        path: `nodes.${index}.id`,
        message: `Duplicate node id "${node.id}".`,
      });
    }
    nodeIds.add(node.id);

    const bit = getBit(node.type);
    if (!bit) {
      // Only reportable when the registry is populated; an empty registry means
      // nothing has been loaded yet, not that every type is unknown.
      if (hasAnyBit()) {
        diagnostics.push({
          path: `nodes.${index}.type`,
          message: `Unknown bit type "${node.type}".`,
        });
      }
      return;
    }

    const parsed = bit.schema.safeParse(node.data);
    if (!parsed.success) {
      for (const issue of toDiagnostics(parsed.error.issues)) {
        diagnostics.push({
          path: `nodes.${index}.data${issue.path ? `.${issue.path}` : ""}`,
          message: issue.message,
        });
      }
    }
  });

  doc.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      diagnostics.push({
        path: `edges.${index}.id`,
        message: `Duplicate edge id "${edge.id}".`,
      });
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source)) {
      diagnostics.push({
        path: `edges.${index}.source`,
        message: `Edge starts at "${edge.source}", which is not a node in this flow.`,
      });
    }
    if (!nodeIds.has(edge.target)) {
      diagnostics.push({
        path: `edges.${index}.target`,
        message: `Edge ends at "${edge.target}", which is not a node in this flow.`,
      });
    }
    if (edge.condition) {
      for (const referenced of conditionNodeIds(edge.condition)) {
        if (!nodeIds.has(referenced)) {
          diagnostics.push({
            path: `edges.${index}.condition`,
            message: `The condition refers to node "${referenced}", which is not a node in this flow.`,
          });
        }
      }
    }
  });

  diagnostics.push(...validateGraphShape(doc));

  return { valid: diagnostics.length === 0, diagnostics };
};

const validateGraphShape = (doc: BitflowDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];

  if (doc.nodes.length === 0) {
    return [{ path: "nodes", message: "The flow has no nodes." }];
  }

  const entries = doc.nodes.filter((n) => incomingEdges(doc, n.id).length === 0);
  if (entries.length === 0) {
    diagnostics.push({
      path: "nodes",
      message:
        "Every node has an incoming edge, so the flow has no place to start.",
    });
  } else if (entries.length > 1) {
    diagnostics.push({
      path: "nodes",
      message: `The flow has ${entries.length} possible starting points (${entries
        .map((n) => `"${n.id}"`)
        .join(", ")}). Connect them so only one node starts the flow.`,
    });
  }

  // Anything the learner can never reach is almost always a mistake, and it is
  // invisible on a large canvas unless we say so.
  const reachable = new Set<string>();
  const queue = entries.map((n) => n.id);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const edge of outgoingEdges(doc, id)) queue.push(edge.target);
  }

  doc.nodes.forEach((node, index) => {
    if (!reachable.has(node.id)) {
      diagnostics.push({
        path: `nodes.${index}.id`,
        message: `Node "${node.id}" cannot be reached from the start of the flow.`,
      });
      return;
    }
    const bit = getBit(node.type);
    if (
      bit &&
      bit.kind !== "end" &&
      outgoingEdges(doc, node.id).length === 0
    ) {
      diagnostics.push({
        path: `nodes.${index}.id`,
        message: `Node "${node.id}" has no outgoing edge, so the learner has nowhere to go after it. Connect it to the next node or to an end.`,
      });
    }
  });

  return diagnostics;
};

/**
 * Whether any bit at all is registered. Used to tell "this type is unknown"
 * apart from "no bit package has been imported yet".
 */
const hasAnyBit = (): boolean => listBits().length > 0;
