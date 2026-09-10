import { beforeEach, describe, expect, it } from "vitest";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { BitEdge, Condition } from "./schema";
import { validateFlow } from "./validate";

/**
 * A condition that can never be true is the worst authoring mistake there is:
 * the flow still runs, the learner still gets somewhere, and the branch the
 * teacher drew quietly does nothing. Everything here is about saying so.
 */
const flow = (condition: Condition, extra: Partial<BitEdge> = {}) =>
  doc(
    [
      node("start", "test-start"),
      node("q1", "test-task", { correct: "a" }),
      node("q2", "test-task", { correct: "b" }),
      node("easy", "test-content"),
      node("hard", "test-content"),
      // A task on the far side of the branch, so "they cannot have reached it
      // yet" has something to point at.
      node("q3", "test-task", { correct: "c" }),
      node("end", "test-end"),
    ],
    [
      edge("start", "q1"),
      edge("q1", "q2"),
      edge("q2", "easy"),
      edge("q2", "hard", { id: "branch", condition, ...extra }),
      edge("easy", "q3"),
      edge("hard", "q3"),
      edge("q3", "end"),
    ],
  );

const problems = (condition: Condition, extra: Partial<BitEdge> = {}) =>
  validateFlow(flow(condition, extra)).diagnostics.map((d) => d.message);

const count = (op: any, right: any, state: any = "correct"): Condition => ({
  type: "compare",
  left: { kind: "resultCount", state },
  op,
  right,
});

describe("validating a branch", () => {
  beforeEach(registerTestBits);

  it("accepts a branch that can fire", () => {
    expect(problems(count("gte", 2))).toEqual([]);
  });

  describe("counting answers", () => {
    it("rejects a threshold no learner could reach", () => {
      // Two tasks come before this connection; three correct is impossible.
      expect(problems(count("gte", 3))[0]).toContain("can never be reached");
    });

    it("accepts a threshold exactly at the number of tasks", () => {
      expect(problems(count("gte", 2))).toEqual([]);
      expect(problems(count("eq", 2))).toEqual([]);
    });

    it("counts only the tasks before the connection", () => {
      // A branch straight off the start has no answered tasks behind it.
      const early = doc(
        [
          node("start", "test-start"),
          node("q", "test-task", { correct: "a" }),
          node("end", "test-end"),
        ],
        [
          edge("start", "q"),
          edge("start", "end", { id: "early", condition: count("gte", 1) }),
          edge("q", "end"),
        ],
      );
      expect(
        validateFlow(early).diagnostics.some((d) =>
          d.message.includes("no tasks before this connection"),
        ),
      ).toBe(true);
    });

    it("rejects more-than at or above the number of tasks", () => {
      expect(problems(count("gt", 2))[0]).toContain("can never be reached");
    });

    it("rejects a fractional or negative count", () => {
      expect(problems(count("gte", 1.5))[0]).toContain("whole number");
      expect(problems(count("gte", -1))[0]).toContain("whole number");
    });

    it("says nothing about at-most, which is reachable by definition", () => {
      expect(problems(count("lte", 99))).toEqual([]);
    });
  });

  describe("reading one task", () => {
    const result = (nodeId: string, right: unknown): Condition => ({
      type: "compare",
      left: { kind: "result", nodeId, path: "state" },
      op: "eq",
      right: right as string,
    });

    it("accepts a task the learner has already met", () => {
      expect(problems(result("q1", "correct"))).toEqual([]);
    });

    it("rejects a task they cannot have reached yet", () => {
      // q3 comes after this connection, not before it.
      expect(problems(result("q3", "correct"))[0]).toContain(
        "cannot have reached",
      );
    });

    it("rejects a node that is not a task", () => {
      expect(problems(result("start", "correct"))[0]).toContain("is not a task");
    });

    it("rejects an outcome that does not exist", () => {
      const messages = problems(result("q1", "manual"));
      expect(messages[0]).toContain("not a possible outcome");
      expect(messages[0]).toContain("correct, wrong, unknown");
    });

    it("lets a task branch on its own result", () => {
      const own = doc(
        [
          node("start", "test-start"),
          node("q", "test-task", { correct: "a" }),
          node("easy", "test-content"),
          node("hard", "test-content"),
          node("end", "test-end"),
        ],
        [
          edge("start", "q"),
          edge("q", "easy"),
          edge("q", "hard", { id: "own", condition: result("q", "correct") }),
          edge("easy", "end"),
          edge("hard", "end"),
        ],
      );
      expect(validateFlow(own).diagnostics).toEqual([]);
    });
  });

  describe("comparisons", () => {
    it("rejects an ordering comparison against something that is not a number", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "tries", nodeId: "q1" },
          op: "gte",
          right: "two",
        })[0],
      ).toContain("not a number");
    });

    it("rejects a membership test without a list", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "result", nodeId: "q1", path: "state" },
          op: "in",
          right: "correct",
        })[0],
      ).toContain("needs a list");
    });

    it("rejects an empty list", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "result", nodeId: "q1", path: "state" },
          op: "in",
          right: [],
        })[0],
      ).toContain("never true");
    });

    it("rejects a comparison with nothing to compare against", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "score" },
          op: "eq",
        })[0],
      ).toContain("nothing to compare against");
    });

    /**
     * Both of these are fractions the author sees as something else — a
     * five-point scale, a percentage — so the number they reach for is the
     * one that can never be true. Nothing else in the flow would say so.
     */
    it("rejects a share of the marks written as a percentage", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "scoreRatio" },
          op: "gte",
          right: 50,
        })[0],
      ).toContain("runs from 0 to 1");
    });

    it("accepts a share of the marks written as a fraction", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "scoreRatio" },
          op: "gte",
          right: 0.5,
        }),
      ).toEqual([]);
    });

    it("rejects a confidence written against the five-point scale", () => {
      expect(
        problems(
          {
            type: "compare",
            left: { kind: "confidence", nodeId: "q1" },
            op: "gte",
            right: 4,
          },
        ).join(" "),
      ).toContain("runs from 0 to 1");
    });

    it("allows isTrue, which needs no right-hand side", () => {
      expect(
        problems({
          type: "compare",
          left: { kind: "answer", nodeId: "q1" },
          op: "isTrue",
        }),
      ).toEqual([]);
    });
  });

  describe("combined conditions", () => {
    it("accepts several rules at once", () => {
      expect(
        problems({
          type: "and",
          conditions: [
            count("gte", 2),
            {
              type: "not",
              condition: {
                type: "compare",
                left: { kind: "result", nodeId: "q1", path: "state" },
                op: "eq",
                right: "correct",
              },
            },
          ],
        }),
      ).toEqual([]);
    });

    it("reports a problem inside a nested rule", () => {
      expect(
        problems({
          type: "and",
          conditions: [count("gte", 2), count("gte", 99)],
        })[0],
      ).toContain("can never be reached");
    });

    it("rejects an empty all-of, which is always true", () => {
      expect(problems({ type: "and", conditions: [] })[0]).toContain(
        "always true",
      );
    });

    it("rejects an empty any-of, which is never true", () => {
      expect(problems({ type: "or", conditions: [] })[0]).toContain(
        "never true",
      );
    });
  });

  it("points every diagnostic at the edge that owns it", () => {
    const { diagnostics } = validateFlow(flow(count("gte", 99)));
    expect(diagnostics[0].path).toMatch(/^edges\.\d+\.condition$/);
  });
});
