import { conditionNodeIds } from "./condition";
import {
  bitflowError,
  toDiagnostics,
  type Diagnostic,
  type Result,
} from "./errors";
import {
  incomingEdges,
  outgoingEdges,
  poolExitEdges,
  poolMembers,
  sectionMembers,
} from "./engine";
import { getBit, listBits } from "./registry";
import {
  BitflowDocumentSchema,
  type BitflowDocument,
} from "./schema";
import { validateCondition } from "./validateCondition";

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
      // Beyond dangling references: the ways a condition can be written so it
      // never fires, which otherwise fail silently.
      diagnostics.push(
        ...validateCondition(doc, edge, `edges.${index}.condition`),
      );
    }
  });

  diagnostics.push(...validateGraphShape(doc));
  diagnostics.push(...validatePools(doc));
  diagnostics.push(...validateSections(doc));

  return { valid: diagnostics.length === 0, diagnostics };
};

/**
 * The ways a section can be written so it does nothing.
 *
 * A section is only ever visible through its members, so one that has none
 * shows nothing, scopes nothing, and looks from the editor exactly like one
 * that works.
 */
const validateSections = (doc: BitflowDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const declared = new Set<string>();

  doc.meta.sections.forEach((section, index) => {
    if (declared.has(section.id)) {
      diagnostics.push({
        path: `meta.sections.${index}.id`,
        message: `Duplicate section "${section.id}".`,
      });
    }
    declared.add(section.id);

    if (sectionMembers(doc, section.id).length === 0) {
      diagnostics.push({
        path: `meta.sections.${index}.id`,
        message: `The section "${section.label || section.id}" has no steps in it, so nothing shows its text.`,
      });
    }
  });

  doc.nodes.forEach((node, index) => {
    if (node.section && !declared.has(node.section)) {
      diagnostics.push({
        path: `nodes.${index}.section`,
        message: `This step is in section "${node.section}", which the flow does not declare.`,
      });
    }
    // A start or an end is not part of the material a section introduces, and
    // showing the passage over the closing summary reads as a mistake.
    const kind = getBit(node.type)?.kind;
    if (node.section && (kind === "start" || kind === "end")) {
      diagnostics.push({
        path: `nodes.${index}.section`,
        message: `A ${kind} step cannot be part of a section.`,
      });
    }
  });

  return diagnostics;
};

/**
 * The ways a pool can be written so it does not do what it says.
 *
 * All silent at runtime: drawing is random, so an author who tries the flow
 * twice may well not notice that a pool has one member, or that a step names
 * a pool nothing declares and is therefore always shown.
 */
const validatePools = (doc: BitflowDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const declared = new Set(doc.meta.pools.map((pool) => pool.id));

  const seen = new Set<string>();
  doc.meta.pools.forEach((pool, index) => {
    if (seen.has(pool.id)) {
      diagnostics.push({
        path: `meta.pools.${index}.id`,
        message: `Duplicate pool "${pool.id}".`,
      });
    }
    seen.add(pool.id);

    const members = poolMembers(doc, pool.id);
    if (members.length === 0) {
      diagnostics.push({
        path: `meta.pools.${index}.id`,
        message: `The pool "${pool.label || pool.id}" has no steps in it.`,
      });
      return;
    }
    if (pool.draw > members.length) {
      diagnostics.push({
        path: `meta.pools.${index}.draw`,
        message: `The pool "${pool.label || pool.id}" draws ${pool.draw} steps but only has ${members.length}. Every learner would get all of them.`,
      });
    }
    // Drawing all of them is a pool that does nothing except look like it
    // varies — worth saying, because the author clearly meant it to. Unless it
    // shuffles, in which case drawing all of them is exactly the point: the
    // same questions in a different order.
    if (pool.draw === members.length && members.length > 1 && !pool.shuffle) {
      diagnostics.push({
        path: `meta.pools.${index}.draw`,
        message: `The pool "${pool.label || pool.id}" draws all ${members.length} of its steps, so every learner gets the same ones. Turn on shuffle to vary the order instead.`,
      });
    }

    if (!pool.shuffle) return;

    // A shuffled pool navigates by its drawn order, so its way out cannot be
    // the internal wiring — after a shuffle the last member is a different one
    // for every learner. It has to leave from one place.
    const exits = poolExitEdges(doc, pool.id);
    if (exits.length === 0) {
      diagnostics.push({
        path: `meta.pools.${index}.shuffle`,
        message: `Nothing leads out of the shuffled pool "${pool.label || pool.id}", so a learner who finishes it has nowhere to go. Connect one of its steps to what comes next.`,
      });
    } else {
      const sources = new Set(exits.map((exit) => exit.source));
      if (sources.size > 1) {
        diagnostics.push({
          path: `meta.pools.${index}.shuffle`,
          message: `${sources.size} steps in the shuffled pool "${pool.label || pool.id}" lead out of it. Because the order changes for every learner, they would all be tried in turn rather than the one you drew. Leave the pool from a single step.`,
        });
      }
    }
  });

  doc.nodes.forEach((node, index) => {
    if (node.pool && !declared.has(node.pool)) {
      diagnostics.push({
        path: `nodes.${index}.pool`,
        message: `This step is in pool "${node.pool}", which the flow does not declare. It will be shown to everyone.`,
      });
    }
    // A pooled start or end is a flow that sometimes cannot begin or finish.
    const kind = getBit(node.type)?.kind;
    if (node.pool && (kind === "start" || kind === "end")) {
      diagnostics.push({
        path: `nodes.${index}.pool`,
        message: `A ${kind} step cannot be part of a pool.`,
      });
    }
  });

  return diagnostics;
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
