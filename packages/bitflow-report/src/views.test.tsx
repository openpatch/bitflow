import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GroupReport } from "./GroupReport";
import { Report } from "./Report";
import type { AttemptReport } from "./report";

const report = (overrides: Partial<AttemptReport> = {}): AttemptReport => ({
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  nodeReports: [
    {
      nodeId: "q1",
      bitType: "task-choice",
      answer: { selected: ["a"] },
      result: { state: "correct" },
      tries: 1,
      elapsedMs: 5000,
    },
    {
      nodeId: "q2",
      bitType: "task-input",
      answer: { input: "x" },
      result: { state: "wrong" },
      tries: 3,
      elapsedMs: 64000,
    },
  ],
  score: { earned: 1, possible: 2 },
  startedAt: "2026-01-01T10:00:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
  ...overrides,
});

describe("<Report>", () => {
  it("shows the score", () => {
    render(<Report report={report()} locale="en" />);
    expect(screen.getByText("1 of 2 points")).toBeDefined();
  });

  it("shows a row per task with its outcome, attempts and time", () => {
    render(<Report report={report()} locale="en" />);
    expect(screen.getByText("Correct")).toBeDefined();
    expect(screen.getByText("Not correct")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("1:04")).toBeDefined();
  });

  it("reads the report out of JSON text", () => {
    render(<Report report={JSON.stringify(report())} locale="en" />);
    expect(screen.getByText("1 of 2 points")).toBeDefined();
  });

  it("says so, and reports it, when the data cannot be read", () => {
    const onError = vi.fn();
    render(<Report report={"{"} locale="en" onError={onError} />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("shows an empty state rather than nothing", () => {
    render(<Report locale="en" />);
    expect(screen.getByText("No results to show.")).toBeDefined();
  });

  it("translates", () => {
    render(<Report report={report()} locale="de" />);
    expect(screen.getByText("1 von 2 Punkten")).toBeDefined();
  });
});

describe("<GroupReport>", () => {
  const cohort = (): AttemptReport[] => [
    report({ attemptId: "a-1", subject: { label: "Alex" } }),
    report({
      attemptId: "a-2",
      subject: { label: "Bo" },
      nodeReports: [
        { nodeId: "q1", bitType: "task-choice", answer: {}, result: { state: "correct" }, tries: 1 },
        { nodeId: "q2", bitType: "task-input", answer: {}, result: { state: "correct" }, tries: 1 },
      ],
      score: { earned: 2, possible: 2 },
    }),
    report({
      attemptId: "a-3",
      subject: { label: "Cam" },
      nodeReports: [
        { nodeId: "q1", bitType: "task-choice", answer: {}, result: { state: "wrong" }, tries: 2 },
        { nodeId: "q2", bitType: "task-input", answer: {}, result: { state: "wrong" }, tries: 1 },
      ],
      score: { earned: 0, possible: 2 },
    }),
  ];

  it("counts the group", () => {
    render(<GroupReport reports={cohort()} locale="en" />);
    expect(screen.getByText("3 learner(s)")).toBeDefined();
  });

  it("names every learner", () => {
    render(<GroupReport reports={cohort()} locale="en" />);
    for (const name of ["Alex", "Bo", "Cam"]) {
      expect(screen.getByText(name)).toBeDefined();
    }
  });

  it("shows how many solved each task", () => {
    render(<GroupReport reports={cohort()} locale="en" />);
    // q1: 2 of 3 correct, q2: 1 of 3.
    expect(screen.getByText("67%")).toBeDefined();
    expect(screen.getByText("33%")).toBeDefined();
  });

  it("shows the distribution and reliability", () => {
    render(<GroupReport reports={cohort()} locale="en" />);
    expect(screen.getByText("Reliability (Cronbach's α)")).toBeDefined();
    expect(screen.getByText("Mean")).toBeDefined();
  });

  it("reads the array out of JSON text", () => {
    render(<GroupReport reports={JSON.stringify(cohort())} locale="en" />);
    expect(screen.getByText("3 learner(s)")).toBeDefined();
  });

  it("says so, and reports it, when the data cannot be read", () => {
    const onError = vi.fn();
    render(<GroupReport reports={"{"} locale="en" onError={onError} />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("shows an empty state for an empty cohort", () => {
    render(<GroupReport reports={[]} locale="en" />);
    expect(screen.getByText("No results to show.")).toBeDefined();
  });
});
