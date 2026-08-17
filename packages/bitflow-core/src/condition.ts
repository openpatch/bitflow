import type {
  BitResult,
  Comparable,
  CompareOp,
  Condition,
  ValueRef,
} from "./schema";

export type ConditionContext = {
  answers: Record<string, unknown>;
  results: Record<string, BitResult>;
  tries: Record<string, number>;
  score: { earned: number; possible: number };
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
    case "score":
      return context.score.earned;
    case "scoreRatio":
      return context.score.possible === 0
        ? 0
        : context.score.earned / context.score.possible;
    case "resultCount":
      // Only tasks the learner has actually reached are in `results`, so this
      // counts what has happened rather than what the flow contains.
      return Object.values(context.results).filter(
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
      // condition false rather than accidentally true through coercion.
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
    case "compare":
      return "nodeId" in condition.left ? [condition.left.nodeId] : [];
  }
};
