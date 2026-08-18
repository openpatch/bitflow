import { clearBits, registerBit } from "@bitflow/core";
import { z } from "zod";
import { beforeEach, describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import { computeGroupStatistics } from "./group";
import type { AttemptReport } from "./report";

const report = (over: Partial<AttemptReport> = {}): AttemptReport => ({
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "a-1",
  status: "completed",
  startedAt: "2026-01-01T10:00:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
  nodeReports: [
    {
      nodeId: "q1",
      bitType: "task-choice",
      answer: {},
      result: { state: "correct", score: { earned: 1, possible: 1 } },
      tries: 1,
    },
    {
      nodeId: "q2",
      bitType: "task-input",
      answer: {},
      result: { state: "wrong", score: { earned: 0, possible: 1 } },
      tries: 2,
    },
  ],
  score: { earned: 1, possible: 2 },
  ...over,
});

/** Splits the two tables the file contains. */
const tables = (csv: string): string[][] =>
  csv
    .split("\n\n")
    .map((table) => table.split("\n"));

describe("toCsv", () => {
  beforeEach(() => {
    clearBits();
    registerBit({
      type: "task-choice",
      kind: "task",
      schema: z.object({}),
      defaultData: () => ({}),
      info: () => ({ name: "Choice", description: "" }),
    });
  });

  const cohort = (): AttemptReport[] => [
    report({ attemptId: "a-1", subject: { label: "Alex" } }),
    report({
      attemptId: "a-2",
      subject: { label: "Bo" },
      nodeReports: [
        {
          nodeId: "q1",
          bitType: "task-choice",
          answer: {},
          result: { state: "correct", score: { earned: 1, possible: 1 } },
          tries: 1,
        },
        {
          nodeId: "q2",
          bitType: "task-input",
          answer: {},
          result: { state: "correct", score: { earned: 1, possible: 1 } },
          tries: 1,
        },
      ],
      score: { earned: 2, possible: 2 },
    }),
  ];

  const build = (reports: AttemptReport[] = cohort()) =>
    toCsv(computeGroupStatistics(reports), reports);

  it("writes one row per learner, with a column per task", () => {
    const [learners] = tables(build());

    expect(learners[0]).toBe(
      "Learner,Rank,Earned,Possible,Ratio,q1,q1 (Outcome),q2,q2 (Outcome)",
    );
    expect(learners).toContain("Bo,1,2,2,1,1,correct,1,correct");
    expect(learners).toContain("Alex,2,1,2,0.5,1,correct,0,wrong");
  });

  it("writes the item statistics as a second table", () => {
    const [, items] = tables(build());

    expect(items[0]).toBe(
      "Task,Type,Answered,Difficulty,Discrimination,Average tries",
    );
    expect(items[1]).toMatch(/^q1,task-choice,2,1,/);
  });

  it("leaves a task the learner never reached empty, not zero", () => {
    const reports = cohort();
    reports[1] = report({
      attemptId: "a-2",
      subject: { label: "Bo" },
      nodeReports: [
        {
          nodeId: "q1",
          bitType: "task-choice",
          answer: {},
          result: { state: "correct", score: { earned: 1, possible: 1 } },
          tries: 1,
        },
      ],
      score: { earned: 1, possible: 1 },
    });

    const [learners] = tables(build(reports));
    const bo = learners.find((line) => line.startsWith("Bo"))!;

    // A blank cell is a fact about the flow; a 0 would be a claim about Bo.
    expect(bo.endsWith(",1,correct,,")).toBe(true);
  });

  it("quotes a name containing a comma instead of splitting the row", () => {
    const awkward = cohort().map((report, index) =>
      index === 0
        ? { ...report, subject: { label: 'O"Brien, Sam' } }
        : report,
    );

    const [learners] = tables(build(awkward));
    const row = learners.find((line) => line.startsWith('"'))!;

    // Doubled quote, wrapped field: one row, five fixed columns plus two per
    // task — not six columns because the name had a comma in it.
    expect(row.startsWith('"O""Brien, Sam",')).toBe(true);
    // Five fixed columns plus two per task — not six because of the comma.
    expect(row.split('",')[1].split(",")).toHaveLength(8);
  });

  it("uses the headers it is given, so the file matches the report", () => {
    const [learners, items] = tables(
      toCsv(computeGroupStatistics(cohort()), cohort(), {
        headers: { learner: "Lernende(r)", task: "Aufgabe" },
      }),
    );

    expect(learners[0]).toContain("Lernende(r)");
    // Anything not overridden keeps its English name rather than blanking.
    expect(items[0]).toBe(
      "Aufgabe,Type,Answered,Difficulty,Discrimination,Average tries",
    );
  });
});
