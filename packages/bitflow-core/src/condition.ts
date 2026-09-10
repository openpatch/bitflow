import { totalScore } from "./score";
import type {
  BitResult,
  Comparable,
  CompareOp,
  Condition,
  Scope,
  ValueRef,
} from "./schema";

/**
 * Everything a branch may read out of the running attempt.
 *
 * Built by `conditionContext(doc, snapshot)`; nothing here is derived at
 * comparison time, so replaying the same context always picks the same path.
 */
export type ConditionContext = {
  answers: Record<string, unknown>;
  results: Record<string, BitResult>;
  tries: Record<string, number>;
  /** How many times each node has been shown, counted off the history. */
  visits: Record<string, number>;
  /** `0`–`1` per node, for the steps the learner was asked about. */
  confidence: Record<string, number>;
  /** Seconds spent per node, including the stretch in progress. */
  timeSpent: Record<string, number>;
  /** Seconds spent across the whole attempt. */
  totalTimeSpent: number;
  /** Seconds left on the flow's own limit, or `null` when it has none. */
  timeRemaining: number | null;
  /** Node ids oldest first, which is what a `last` scope counts back through. */
  history: string[];
  /** Node id → section id, for a section-scoped count or score. */
  sections: Record<string, string>;
};

/**
 * Reads `a.b.0.c` out of a nested value. Returns `undefined` for any missing
 * segment rather than throwing, so a condition that points at a node the
 * learner has not reached yet is simply false instead of fatal.
 */
export const getPath = (value: unknown, path?: string): unknown => {
  if (!path) return value;
  let current = value;
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

/**
 * The node ids a scope covers, or `undefined` for "everything the learner has
 * a result for" — which is what an absent scope means.
 */
const scopedNodeIds = (
  scope: Scope | undefined,
  context: ConditionContext,
): string[] | undefined => {
  if (!scope) return undefined;
  switch (scope.kind) {
    case "nodes":
      return scope.nodeIds;
    case "section":
      return Object.keys(context.sections).filter(
        (nodeId) => context.sections[nodeId] === scope.id,
      );
    case "last": {
      // Walked backwards through the history so "the last three" means the
      // three most recently *reached*, not the last three in the file. A node
      // visited twice is one task and counts once.
      const picked: string[] = [];
      for (
        let i = context.history.length - 1;
        i >= 0 && picked.length < scope.count;
        i--
      ) {
        const nodeId = context.history[i];
        if (picked.includes(nodeId)) continue;
        if (!(nodeId in context.results)) continue;
        picked.push(nodeId);
      }
      return picked;
    }
  }
};

/** The results a scope covers. Steps with no result are simply not in it. */
const resultsIn = (
  scope: Scope | undefined,
  context: ConditionContext,
): BitResult[] => {
  const nodeIds = scopedNodeIds(scope, context);
  if (!nodeIds) return Object.values(context.results);
  return nodeIds
    .map((nodeId) => context.results[nodeId])
    .filter((result): result is BitResult => result !== undefined);
};

export const resolveValueRef = (
  ref: ValueRef,
  context: ConditionContext,
): unknown => {
  switch (ref.kind) {
    case "answer":
      return getPath(context.answers[ref.nodeId], ref.path);
    case "result":
      return getPath(context.results[ref.nodeId], ref.path);
    case "tries":
      return context.tries[ref.nodeId] ?? 0;
    case "visits":
      return context.visits[ref.nodeId] ?? 0;
    case "confidence":
      // Deliberately not defaulted to 0: a step nobody was asked about has no
      // confidence, and "less than 0.5 sure" must not be true of everyone who
      // was never asked.
      return context.confidence[ref.nodeId];
    case "timeSpent":
      return ref.nodeId === undefined
        ? context.totalTimeSpent
        : context.timeSpent[ref.nodeId] ?? 0;
    case "timeRemaining":
      // Undefined rather than Infinity: with no limit there is no answer, and
      // every ordering comparison against undefined is false.
      return context.timeRemaining ?? undefined;
    case "score":
      return totalScore(resultsIn(ref.scope, context)).earned;
    case "scoreRatio": {
      const score = totalScore(resultsIn(ref.scope, context));
      return score.possible === 0 ? 0 : score.earned / score.possible;
    }
    case "resultCount":
      // Only tasks the learner has actually reached are in `results`, so this
      // counts what has happened rather than what the flow contains.
      return resultsIn(ref.scope, context).filter(
        (result) => result.state === ref.state,
      ).length;
  }
};

const asNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value);

export const evaluateCondition = (
  condition: Condition,
  context: ConditionContext,
): boolean => {
  switch (condition.type) {
    case "always":
      return true;
    case "not":
      return !evaluateCondition(condition.condition, context);
    case "and":
      return condition.conditions.every((c) => evaluateCondition(c, context));
    case "or":
      return condition.conditions.some((c) => evaluateCondition(c, context));
    case "compare":
      return compare(
        resolveValueRef(condition.left, context),
        condition.op,
        condition.right,
      );
  }
};

const compare = (
  left: unknown,
  op: CompareOp,
  right: Comparable | Comparable[] | undefined,
): boolean => {
  switch (op) {
    case "isTrue":
      return left === true;
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "in":
      return Array.isArray(right)
        ? right.includes(left as Comparable)
        : false;
    case "notIn":
      return Array.isArray(right)
        ? !right.includes(left as Comparable)
        : false;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      // Ordering comparisons are numeric only; a non-numeric operand makes the
      // condition false rather than accidentally true through coercion. That is
      // also what keeps an absent confidence or an absent time limit from
      // firing a branch for everyone.
      if (left === undefined || left === null) return false;
      const a = asNumber(left);
      const b = asNumber(right);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (op === "gt") return a > b;
      if (op === "gte") return a >= b;
      if (op === "lt") return a < b;
      return a <= b;
    }
    default:
      return false;
  }
};

/** Every node id a condition reads, for validation and dependency checks. */
export const conditionNodeIds = (condition: Condition): string[] => {
  switch (condition.type) {
    case "always":
      return [];
    case "not":
      return conditionNodeIds(condition.condition);
    case "and":
    case "or":
      return condition.conditions.flatMap(conditionNodeIds);
    case "compare": {
      const { left } = condition;
      if ("nodeId" in left && left.nodeId !== undefined) return [left.nodeId];
      // A hand-picked scope names nodes too, and a dangling id there is the
      // same authoring mistake.
      if ("scope" in left && left.scope?.kind === "nodes") {
        return left.scope.nodeIds;
      }
      return [];
    }
  }
};

/** Every section id a condition reads, so validation can catch a stale one. */
export const conditionSectionIds = (condition: Condition): string[] => {
  switch (condition.type) {
    case "always":
      return [];
    case "not":
      return conditionSectionIds(condition.condition);
    case "and":
    case "or":
      return condition.conditions.flatMap(conditionSectionIds);
    case "compare": {
      const { left } = condition;
      return "scope" in left && left.scope?.kind === "section"
        ? [left.scope.id]
        : [];
    }
  }
};
