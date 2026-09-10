import type { Diagnostic } from "./errors";
import { incomingEdges } from "./engine";
import { getBit } from "./registry";
import {
  BIT_RESULT_STATES,
  type BitEdge,
  type BitflowDocument,
  type Condition,
  type Scope,
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
  const sectionIds = new Set(doc.meta.sections.map((section) => section.id));
  const reachable = nodesBefore(doc, edge.source);
  // How many tasks a learner could possibly have answered by this point.
  const answerable = reachable.filter((id) => taskIds.has(id)).length;
  const before = new Set(reachable);

  /**
   * How many tasks a scope can contribute by this point. A threshold above it
   * is a branch that never fires, which is the whole point of this pass.
   */
  const answerableIn = (scope: Scope | undefined): number => {
    if (!scope) return answerable;
    switch (scope.kind) {
      case "nodes":
        return scope.nodeIds.filter(
          (id) => taskIds.has(id) && before.has(id),
        ).length;
      case "section":
        return doc.nodes.filter(
          (node) =>
            node.section === scope.id &&
            taskIds.has(node.id) &&
            before.has(node.id),
        ).length;
      case "last":
        // "Of the last five" can only ever be as many as they have answered.
        return Math.min(scope.count, answerable);
    }
  };

  /** The ways a scope can be written so it covers nothing. */
  const checkScope = (scope: Scope | undefined): void => {
    if (!scope) return;
    if (scope.kind === "section") {
      if (!sectionIds.has(scope.id)) {
        diagnostics.push({
          path,
          message: `This rule counts section "${scope.id}", which the flow does not declare.`,
        });
      } else if (answerableIn(scope) === 0) {
        diagnostics.push({
          path,
          message: `Section "${scope.id}" has no task before this connection, so counting it here is never anything but zero.`,
        });
      }
      return;
    }
    if (scope.kind === "nodes") {
      if (scope.nodeIds.length === 0) {
        diagnostics.push({
          path,
          message: "This rule counts no steps at all, so it is always zero.",
        });
        return;
      }
      for (const id of scope.nodeIds) {
        if (!nodeIds.has(id)) {
          diagnostics.push({
            path,
            message: `This rule counts "${id}", which is not a node in this flow.`,
          });
        } else if (!taskIds.has(id)) {
          diagnostics.push({
            path,
            message: `"${id}" is not a task, so it never contributes a result to count.`,
          });
        } else if (!before.has(id)) {
          diagnostics.push({
            path,
            message: `The learner cannot have reached "${id}" by this point in the flow, so counting it here does nothing.`,
          });
        }
      }
    }
  };

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

    if ("scope" in left) checkScope(left.scope);

    // A branch that reads a task the learner has not met yet can never be true.
    const nodeId = "nodeId" in left ? left.nodeId : undefined;
    if (nodeId !== undefined && nodeIds.has(nodeId)) {
      // `visits` and `timeSpent` are true of any step; the rest need a task.
      // `answer` sits with them because a content bit may hold one.
      const anyStep =
        left.kind === "answer" ||
        left.kind === "visits" ||
        left.kind === "timeSpent";
      if (!anyStep && !taskIds.has(nodeId)) {
        diagnostics.push({
          path,
          message: `"${nodeId}" is not a task, so it never has a result to compare. Point this at a task.`,
        });
      } else if (!before.has(nodeId)) {
        diagnostics.push({
          path,
          message: `The learner cannot have reached "${nodeId}" by this point in the flow, so this connection is never followed.`,
        });
      }
    }

    // Reading something the flow never collects.
    if (left.kind === "confidence" && !doc.meta.askConfidence) {
      diagnostics.push({
        path,
        message:
          "This flow does not ask how sure the learner is, so there is never a confidence to compare. Turn on the confidence question, or use a different rule.",
      });
    }
    if (left.kind === "timeRemaining" && doc.meta.timeLimit === undefined) {
      diagnostics.push({
        path,
        message:
          "This flow has no time limit, so there is never any time remaining to compare. Set a limit for the whole assessment, or use time spent instead.",
      });
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
      checkConfidenceRange(left, right);
      checkRatioRange(left, right);
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

    if (typeof right === "number") {
      checkCountRange(left, op, right);
      checkConfidenceRange(left, right);
      checkRatioRange(left, right);
    }
  };

  /**
   * Confidence is a fraction, and the scale the learner sees has five points on
   * it. Comparing against 4 is the mistake everyone makes once.
   */
  const checkConfidenceRange = (left: ValueRef, right: number): void => {
    if (left.kind !== "confidence") return;
    if (right >= 0 && right <= 1) return;
    diagnostics.push({
      path,
      message: `How sure the learner is runs from 0 to 1, so "${right}" is outside it. The top of the five-point scale is 1, the middle is 0.6.`,
    });
  };

  /**
   * A share of the marks is a fraction, not a percentage. "Half" is 0.5, and a
   * rule written against 50 is a branch that can never fire — the same mistake
   * as writing confidence against the five-point scale, and just as silent.
   */
  const checkRatioRange = (left: ValueRef, right: number): void => {
    if (left.kind !== "scoreRatio") return;
    if (right >= 0 && right <= 1) return;
    diagnostics.push({
      path,
      message: `The share of the marks runs from 0 to 1, so "${right}" is outside it. Half the marks is 0.5, all of them is 1.`,
    });
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
    // Counted against the scope, not the whole flow: "three of the last two"
    // is as unreachable as "three of the two that came before".
    const reachableCount = answerableIn(left.scope);
    if ((op === "gte" || op === "eq") && right > reachableCount) {
      diagnostics.push({
        path,
        message:
          reachableCount === 0
            ? "There are no tasks before this connection, so counting answers here is never true."
            : `Only ${reachableCount} task(s) come before this connection, so "${right}" can never be reached.`,
      });
    }
    if (op === "gt" && right >= reachableCount) {
      diagnostics.push({
        path,
        message: `Only ${reachableCount} task(s) come before this connection, so more than ${right} can never be reached.`,
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
