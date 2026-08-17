import type { Diagnostic } from "./errors";
import { incomingEdges } from "./engine";
import { getBit } from "./registry";
import {
  BIT_RESULT_STATES,
  type BitEdge,
  type BitflowDocument,
  type Condition,
  type ValueRef,
} from "./schema";

/**
 * Checks a branch for the mistakes that make it silently never fire.
 *
 * A condition that is always false is the worst kind of authoring error: the
 * flow still runs, the learner still gets somewhere, and the teacher never
 * finds out that the branch they drew does nothing. Everything reported here
 * is a condition that cannot behave the way it was written.
 */
export const validateCondition = (
  doc: BitflowDocument,
  edge: BitEdge,
  path: string,
): Diagnostic[] => {
  if (!edge.condition) return [];

  const diagnostics: Diagnostic[] = [];
  const taskIds = new Set(
    doc.nodes.filter((n) => getBit(n.type)?.kind === "task").map((n) => n.id),
  );
  const nodeIds = new Set(doc.nodes.map((n) => n.id));
  // How many tasks a learner could possibly have answered by this point.
  const answerable = nodesBefore(doc, edge.source).filter((id) =>
    taskIds.has(id),
  ).length;
  const before = new Set(nodesBefore(doc, edge.source));

  const walk = (condition: Condition): void => {
    switch (condition.type) {
      case "always":
        return;
      case "not":
        walk(condition.condition);
        return;
      case "and":
      case "or":
        if (condition.conditions.length === 0) {
          diagnostics.push({
            path,
            message:
              condition.type === "and"
                ? "This condition has nothing in it, so it is always true. Add a rule or remove it."
                : "This condition has nothing in it, so it is never true. Add a rule or remove it.",
          });
        }
        condition.conditions.forEach(walk);
        return;
      case "compare":
        checkCompare(condition);
    }
  };

  const checkCompare = (
    condition: Extract<Condition, { type: "compare" }>,
  ): void => {
    const { left, op, right } = condition;

    // A branch that reads a task the learner has not met yet can never be true.
    if ("nodeId" in left && nodeIds.has(left.nodeId)) {
      if (!taskIds.has(left.nodeId) && left.kind !== "answer") {
        diagnostics.push({
          path,
          message: `"${left.nodeId}" is not a task, so it never has a result to compare. Point this at a task.`,
        });
      } else if (!before.has(left.nodeId)) {
        diagnostics.push({
          path,
          message: `The learner cannot have reached "${left.nodeId}" by this point in the flow, so this connection is never followed.`,
        });
      }
    }

    if (op === "in" || op === "notIn") {
      if (!Array.isArray(right)) {
        diagnostics.push({
          path,
          message:
            "This comparison needs a list of values to check against.",
        });
      } else if (right.length === 0) {
        diagnostics.push({
          path,
          message: "The list to check against is empty, so this is never true.",
        });
      }
      return;
    }

    if (op === "isTrue") return;

    if (right === undefined) {
      diagnostics.push({ path, message: "This comparison has nothing to compare against." });
      return;
    }

    if (op === "gt" || op === "gte" || op === "lt" || op === "lte") {
      if (typeof right !== "number") {
        diagnostics.push({
          path,
          message: `"${String(right)}" is not a number, and this comparison only works on numbers.`,
        });
        return;
      }
      checkCountRange(left, op, right);
      return;
    }

    // eq / ne against a result state: only the real states can ever match.
    if (
      left.kind === "result" &&
      left.path === "state" &&
      typeof right === "string" &&
      !(BIT_RESULT_STATES as readonly string[]).includes(right)
    ) {
      diagnostics.push({
        path,
        message: `"${right}" is not a possible outcome. Use one of: ${BIT_RESULT_STATES.join(", ")}.`,
      });
    }

    if (left.kind === "resultCount" && typeof right === "number") {
      checkCountRange(left, op, right);
    }
  };

  /** A threshold no learner could reach is a branch that never fires. */
  const checkCountRange = (
    left: ValueRef,
    op: string,
    right: number,
  ): void => {
    if (left.kind !== "resultCount") return;

    if (right < 0 || !Number.isInteger(right)) {
      diagnostics.push({
        path,
        message: "The number of tasks has to be a whole number, zero or more.",
      });
      return;
    }
    if ((op === "gte" || op === "eq") && right > answerable) {
      diagnostics.push({
        path,
        message:
          answerable === 0
            ? "There are no tasks before this connection, so counting answers here is never true."
            : `Only ${answerable} task(s) come before this connection, so "${right}" can never be reached.`,
      });
    }
    if (op === "gt" && right >= answerable) {
      diagnostics.push({
        path,
        message: `Only ${answerable} task(s) come before this connection, so more than ${right} can never be reached.`,
      });
    }
  };

  walk(edge.condition);
  return diagnostics;
};

/**
 * Every node the learner could have visited before arriving at `nodeId`,
 * including `nodeId` itself — a task can branch on its own result.
 *
 * Walks incoming edges, so a cycle terminates on the visited set.
 */
const nodesBefore = (doc: BitflowDocument, nodeId: string): string[] => {
  const seen = new Set<string>([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of incomingEdges(doc, current)) {
      if (seen.has(edge.source)) continue;
      seen.add(edge.source);
      queue.push(edge.source);
    }
  }

  return [...seen];
};

/** Exported for the editor, which shows a branch's reachable tasks. */
export const tasksBefore = (
  doc: BitflowDocument,
  nodeId: string,
): string[] =>
  nodesBefore(doc, nodeId).filter((id) => {
    const node = doc.nodes.find((n) => n.id === id);
    return node && getBit(node.type)?.kind === "task";
  });
