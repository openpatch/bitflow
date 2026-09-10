import {
  clearBits,
  registerBit,
  type AttemptSnapshot,
  type BitflowDocument,
} from "@bitflow/core";
import { z } from "zod";
import { beforeEach, describe, expect, it } from "vitest";
import { computeGroupStatistics } from "./group";
import {
  createReport,
  parseReport,
  parseReports,
  type AttemptReport,
} from "./report";

const doc: BitflowDocument = {
  version: 1,
  meta: {
    id: "flow-1",
    title: "Test",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
    pools: [],
    sections: [],
    navigation: "back",
    allowSkip: true,
  },
  nodes: [
    { id: "start", type: "t-start", position: { x: 0, y: 0 }, data: {} },
    { id: "q1", type: "t-task", position: { x: 0, y: 0 }, data: {} },
    { id: "q2", type: "t-task", position: { x: 0, y: 0 }, data: {} },
  ],
  edges: [],
};

const registerBits = () => {
  clearBits();
  registerBit({
    type: "t-start",
    kind: "start",
    schema: z.object({}),
    defaultData: () => ({}),
    info: () => ({ name: "Start", description: "" }),
  });
  registerBit({
    type: "t-task",
    kind: "task",
    schema: z.object({}),
    defaultData: () => ({}),
    info: () => ({ name: "Task", description: "" }),
    evaluate: () => ({ state: "correct" }),
  });
};

const attempt = (overrides: Partial<AttemptSnapshot> = {}): AttemptSnapshot => ({
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  pools: {},
  currentNodeId: "q2",
  history: ["start", "q1", "q2"],
  answers: { q1: "a", q2: "b" },
  results: { q1: { state: "correct" }, q2: { state: "wrong" } },
  tries: { q1: 1, q2: 2 },
  elapsedMs: { q1: 5000, q2: 12000 },
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z",
  enteredAt: "2026-01-01T10:04:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
  ...overrides,
});

describe("createReport", () => {
  beforeEach(registerBits);

  it("records identity, status and timing", () => {
    const report = createReport(doc, attempt());
    expect(report).toMatchObject({
      schemaVersion: 1,
      flowId: "flow-1",
      flowSchemaVersion: 1,
      attemptId: "attempt-1",
      status: "completed",
      startedAt: "2026-01-01T10:00:00.000Z",
      completedAt: "2026-01-01T10:05:00.000Z",
    });
  });

  it("includes only the tasks, in the order the learner met them", () => {
    const report = createReport(doc, attempt());
    // "start" is a start bit, not something a teacher grades.
    expect(report.nodeReports.map((n) => n.nodeId)).toEqual(["q1", "q2"]);
  });

  it("carries each task's answer, result, tries and time", () => {
    const report = createReport(doc, attempt());
    expect(report.nodeReports[1]).toEqual({
      nodeId: "q2",
      bitType: "t-task",
      answer: "b",
      result: { state: "wrong" },
      tries: 2,
      elapsedMs: 12000,
    });
  });

  it("totals the score", () => {
    expect(createReport(doc, attempt()).score).toEqual({ earned: 1, possible: 2 });
  });

  it("keeps unassessed tasks out of the total", () => {
    const report = createReport(
      doc,
      attempt({ results: { q1: { state: "correct" }, q2: { state: "unknown" } } }),
    );
    expect(report.score).toEqual({ earned: 1, possible: 1 });
  });

  it("reports an unfinished attempt as abandoned", () => {
    const report = createReport(doc, attempt({ status: "inProgress" }));
    expect(report.status).toBe("abandoned");
  });

  it("attaches the subject the host supplied", () => {
    const report = createReport(doc, attempt(), { id: "s-1", label: "Alex" });
    expect(report.subject).toEqual({ id: "s-1", label: "Alex" });
  });

  it("produces something the schema accepts", () => {
    expect(parseReport(createReport(doc, attempt())).ok).toBe(true);
  });
});

describe("parseReport", () => {
  beforeEach(registerBits);

  it("accepts JSON text", () => {
    const report = createReport(doc, attempt());
    expect(parseReport(JSON.stringify(report)).ok).toBe(true);
  });

  it("rejects text that is not JSON", () => {
    const parsed = parseReport("{");
    expect(parsed.ok).toBe(false);
  });

  it("rejects a report of the wrong shape, with a path", () => {
    const parsed = parseReport({ schemaVersion: 1, flowId: "x" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("INVALID_ATTEMPT");
      expect(parsed.error.diagnostics?.length).toBeGreaterThan(0);
    }
  });

  it("says which entry of a group was bad", () => {
    const report = createReport(doc, attempt());
    const parsed = parseReports([report, { nonsense: true }]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.message).toContain("Report 2");
  });

  it("rejects anything that is not an array", () => {
    expect(parseReports({}).ok).toBe(false);
  });
});

describe("computeGroupStatistics", () => {
  beforeEach(registerBits);

  /** Five learners; q1 is easy, q2 separates them. */
  const cohort = (): AttemptReport[] =>
    [
      { label: "Alex", q1: true, q2: true },
      { label: "Bo", q1: true, q2: true },
      { label: "Cam", q1: true, q2: false },
      { label: "Dee", q1: true, q2: false },
      { label: "Eli", q1: false, q2: false },
    ].map(({ label, q1, q2 }, index) =>
      createReport(
        doc,
        attempt({
          attemptId: `attempt-${index}`,
          results: {
            q1: { state: q1 ? "correct" : "wrong" },
            q2: { state: q2 ? "correct" : "wrong" },
          },
        }),
        { label },
      ),
    );

  /**
   * A branched cohort: everyone answers q1, only some reach q2. This is the
   * normal shape for a flow with conditions on its edges, not an edge case.
   */
  const branchedCohort = (): AttemptReport[] =>
    [
      { label: "Alex", q1: true, q2: true },
      { label: "Bo", q1: true, q2: false },
      { label: "Cam", q1: false, q2: null },
      { label: "Dee", q1: false, q2: null },
    ].map(({ label, q1, q2 }, index) =>
      createReport(
        doc,
        attempt({
          attemptId: `attempt-${index}`,
          results: {
            q1: { state: q1 ? "correct" : "wrong" },
            ...(q2 === null
              ? {}
              : { q2: { state: q2 ? "correct" : "wrong" } }),
          },
        }),
        { label },
      ),
    );

  it("says alpha covered the whole assessment when everyone saw all of it", () => {
    expect(computeGroupStatistics(cohort()).reliability).toEqual({
      common: 2,
      total: 2,
    });
  });

  it("measures alpha only over the tasks every learner reached", () => {
    const stats = computeGroupStatistics(branchedCohort());

    // q2 is still an item in the table — two learners answered it — but it
    // cannot be part of a statistic that assumes everyone did.
    expect(stats.items).toHaveLength(2);
    expect(stats.reliability).toEqual({ common: 1, total: 2 });
  });

  it("declines to report alpha when the common core is a single task", () => {
    // Alpha over one item is not a small number, it is not a number.
    expect(computeGroupStatistics(branchedCohort()).cronbachsAlpha).toBeNull();
  });

  it("does not treat a task a learner never reached as one they got wrong", () => {
    // The old matrix filled unreached items with 0, which manufactured
    // agreement between items and inflated alpha. Two learners who never met
    // q2 must not make q2 look like it agrees with q1.
    const reached = computeGroupStatistics(cohort()).cronbachsAlpha;
    const branched = computeGroupStatistics(branchedCohort()).cronbachsAlpha;

    expect(reached).not.toBeNull();
    expect(branched).toBeNull();
  });

  it("counts the learners", () => {
    expect(computeGroupStatistics(cohort()).learners).toBe(5);
  });

  it("reports difficulty as the share who got it right", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.items[0].difficulty).toBeCloseTo(0.8, 10); // 4 of 5
    expect(stats.items[1].difficulty).toBeCloseTo(0.4, 10); // 2 of 5
  });

  it("counts each outcome per task", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.items[0].counts).toMatchObject({ correct: 4, wrong: 1 });
  });

  it("reports discrimination, positive for an item that tracks the total", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.items[1].discrimination).toBeGreaterThan(0.5);
  });

  it("declines to report discrimination when nothing varies", () => {
    const identical = [0, 1, 2].map((index) =>
      createReport(
        doc,
        attempt({
          attemptId: `a-${index}`,
          results: { q1: { state: "correct" }, q2: { state: "correct" } },
        }),
      ),
    );
    expect(computeGroupStatistics(identical).items[0].discrimination).toBeNull();
  });

  it("ranks the learners by score", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.scores.map((s) => s.rank)).toEqual([1, 1, 3, 3, 5]);
    expect(stats.scores[0].label).toBe("Alex");
  });

  it("summarises the score distribution", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.summary?.mean).toBeCloseTo(1.2, 10); // 2+2+1+1+0 over 5
    expect(stats.summary?.max).toBe(2);
    expect(stats.summary?.min).toBe(0);
  });

  it("computes reliability across the items", () => {
    const stats = computeGroupStatistics(cohort());
    expect(stats.cronbachsAlpha).not.toBeNull();
    expect(stats.cronbachsAlpha).toBeGreaterThan(0);
  });

  it("copes with an empty cohort", () => {
    const stats = computeGroupStatistics([]);
    expect(stats).toMatchObject({ learners: 0, items: [], scores: [] });
    expect(stats.summary).toBeNull();
    expect(stats.cronbachsAlpha).toBeNull();
  });

  it("includes an item only some learners reached", () => {
    const [first, second] = cohort();
    const shortened: AttemptReport = {
      ...second,
      nodeReports: second.nodeReports.slice(0, 1),
    };
    const stats = computeGroupStatistics([first, shortened]);
    expect(stats.items).toHaveLength(2);
    expect(stats.items[1].answered).toBe(1);
  });

  it("falls back to the attempt id when no learner label was supplied", () => {
    const report = createReport(doc, attempt());
    expect(computeGroupStatistics([report]).scores[0].label).toBe("attempt-1");
  });
});
