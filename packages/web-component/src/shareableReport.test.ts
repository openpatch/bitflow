import { clearBits, registerBit, type AttemptSnapshot, type BitflowDocument } from "@bitflow/core";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createShareableReport } from "./shareableReport";

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
  ],
  edges: [],
};

const attempt: AttemptSnapshot = {
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  pools: {},
  currentNodeId: "q1",
  history: ["start", "q1"],
  answers: { q1: "my private answer" },
  results: { q1: { state: "correct", score: { earned: 1, possible: 1 } } },
  tries: { q1: 1 },
  elapsedMs: { q1: 5000 },
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z",
  enteredAt: "2026-01-01T10:04:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
};

beforeEach(() => {
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
});

describe("createShareableReport", () => {
  it("keeps the results and takes every answer out", () => {
    const report = createShareableReport(doc, attempt, { id: "p1", label: "Ada" });
    expect(report.subject).toEqual({ id: "p1", label: "Ada" });
    expect(report.nodeReports.find((node) => node.nodeId === "q1")?.result?.state).toBe("correct");
    expect(JSON.stringify(report)).not.toContain("my private answer");
    expect(report.nodeReports.every((node) => !("answer" in node))).toBe(true);
  });
});
