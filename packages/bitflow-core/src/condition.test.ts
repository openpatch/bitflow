import { describe, expect, it } from "vitest";
import {
  conditionNodeIds,
  evaluateCondition,
  getPath,
  resolveValueRef,
  type ConditionContext,
} from "./condition";
import type { Condition } from "./schema";

const context: ConditionContext = {
  answers: { q1: { choices: ["a", "c"], text: "hello" }, q2: true },
  results: { q1: { state: "correct" }, q2: { state: "wrong" } },
  tries: { q1: 2 },
  score: { earned: 3, possible: 4 },
};

const check = (condition: Condition) => evaluateCondition(condition, context);

describe("getPath", () => {
  it("reads nested values", () => {
    expect(getPath({ a: { b: [1, 2] } }, "a.b.1")).toBe(2);
  });

  it("returns the value itself for an empty path", () => {
    expect(getPath({ a: 1 })).toEqual({ a: 1 });
  });

  it("returns undefined instead of throwing on a missing branch", () => {
    expect(getPath({ a: 1 }, "b.c.d")).toBeUndefined();
    expect(getPath(undefined, "a")).toBeUndefined();
    expect(getPath("scalar", "length")).toBeUndefined();
  });
});

describe("resolveValueRef", () => {
  it("reads answers, results and tries", () => {
    expect(resolveValueRef({ kind: "answer", nodeId: "q1", path: "text" }, context)).toBe("hello");
    expect(resolveValueRef({ kind: "result", nodeId: "q1", path: "state" }, context)).toBe("correct");
    expect(resolveValueRef({ kind: "tries", nodeId: "q1" }, context)).toBe(2);
  });

  it("treats an untouched node as zero tries", () => {
    expect(resolveValueRef({ kind: "tries", nodeId: "never" }, context)).toBe(0);
  });

  it("exposes the running score", () => {
    expect(resolveValueRef({ kind: "score" }, context)).toBe(3);
    expect(resolveValueRef({ kind: "scoreRatio" }, context)).toBe(0.75);
  });

  it("reports a ratio of zero when nothing is scorable yet", () => {
    expect(
      resolveValueRef(
        { kind: "scoreRatio" },
        { ...context, score: { earned: 0, possible: 0 } },
      ),
    ).toBe(0);
  });
});

describe("evaluateCondition", () => {
  const resultState = (op: any, right?: any): Condition => ({
    type: "compare",
    left: { kind: "result", nodeId: "q1", path: "state" },
    op,
    right,
  });

  it("compares for equality", () => {
    expect(check(resultState("eq", "correct"))).toBe(true);
    expect(check(resultState("ne", "correct"))).toBe(false);
  });

  it("compares numerically", () => {
    const tries = (op: any, right: number): Condition => ({
      type: "compare",
      left: { kind: "tries", nodeId: "q1" },
      op,
      right,
    });
    expect(check(tries("gt", 1))).toBe(true);
    expect(check(tries("gte", 2))).toBe(true);
    expect(check(tries("lt", 2))).toBe(false);
    expect(check(tries("lte", 2))).toBe(true);
  });

  it("is false rather than coercing when an operand is not numeric", () => {
    expect(check(resultState("gt", 1))).toBe(false);
  });

  it("checks membership", () => {
    expect(check(resultState("in", ["correct", "manual"]))).toBe(true);
    expect(check(resultState("notIn", ["correct", "manual"]))).toBe(false);
  });

  it("checks truthiness strictly", () => {
    expect(
      check({
        type: "compare",
        left: { kind: "answer", nodeId: "q2" },
        op: "isTrue",
      }),
    ).toBe(true);
    expect(
      check({
        type: "compare",
        left: { kind: "answer", nodeId: "q1", path: "text" },
        op: "isTrue",
      }),
    ).toBe(false);
  });

  it("combines with and/or/not", () => {
    const correct = resultState("eq", "correct");
    const wrong = resultState("eq", "wrong");
    expect(check({ type: "and", conditions: [correct, wrong] })).toBe(false);
    expect(check({ type: "or", conditions: [correct, wrong] })).toBe(true);
    expect(check({ type: "not", condition: wrong })).toBe(true);
    expect(check({ type: "always" })).toBe(true);
  });

  it("nests combinators", () => {
    expect(
      check({
        type: "or",
        conditions: [
          { type: "and", conditions: [resultState("eq", "wrong")] },
          { type: "not", condition: resultState("eq", "wrong") },
        ],
      }),
    ).toBe(true);
  });

  it("is false for a node the learner has not reached", () => {
    expect(
      check({
        type: "compare",
        left: { kind: "result", nodeId: "unvisited", path: "state" },
        op: "eq",
        right: "correct",
      }),
    ).toBe(false);
  });
});

describe("conditionNodeIds", () => {
  it("collects every referenced node, however deeply nested", () => {
    const condition: Condition = {
      type: "or",
      conditions: [
        {
          type: "and",
          conditions: [
            {
              type: "compare",
              left: { kind: "answer", nodeId: "a" },
              op: "isTrue",
            },
            {
              type: "not",
              condition: {
                type: "compare",
                left: { kind: "result", nodeId: "b", path: "state" },
                op: "eq",
                right: "correct",
              },
            },
          ],
        },
        { type: "compare", left: { kind: "score" }, op: "gt", right: 2 },
      ],
    };
    expect(conditionNodeIds(condition).sort()).toEqual(["a", "b"]);
  });
});
