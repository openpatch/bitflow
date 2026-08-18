import { scoreOf } from "@bitflow/core";
import type { AttemptReport } from "./report";
import type { GroupStatistics } from "./group";

/**
 * The cohort as a spreadsheet.
 *
 * Teachers work in spreadsheets, and a report that can only be looked at is a
 * report whose numbers cannot be combined with anything else — a register, an
 * earlier run, the rest of the term. One row per learner, one column per task,
 * plus the totals; the item statistics are a second table, because difficulty
 * and discrimination are per task and would not fit the same shape.
 */

/**
 * Escapes one field. Quotes are doubled and anything containing a comma,
 * quote or newline is wrapped — a learner called `O'Brien, Sam` must not
 * silently become two columns.
 */
const cell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const row = (values: Array<string | number | null | undefined>): string =>
  values.map(cell).join(",");

/** `null` where a learner never reached the task, which is not a zero. */
const scoreFor = (report: AttemptReport, nodeId: string): number | null => {
  const nodeReport = report.nodeReports.find((n) => n.nodeId === nodeId);
  if (!nodeReport?.result) return null;
  const score = scoreOf(nodeReport.result);
  return score.possible === 0 ? null : score.earned;
};

const outcomeFor = (report: AttemptReport, nodeId: string): string => {
  const nodeReport = report.nodeReports.find((n) => n.nodeId === nodeId);
  return nodeReport?.result?.state ?? "";
};

export type CsvOptions = {
  /**
   * Column headers, so the file reads in the same language as the report that
   * produced it. Any omitted header falls back to its English name.
   */
  headers?: Partial<Record<
    | "learner"
    | "rank"
    | "earned"
    | "possible"
    | "ratio"
    | "task"
    | "type"
    | "answered"
    | "difficulty"
    | "discrimination"
    | "averageTries"
    | "outcome",
    string
  >>;
};

const DEFAULT_HEADERS = {
  learner: "Learner",
  rank: "Rank",
  earned: "Earned",
  possible: "Possible",
  ratio: "Ratio",
  task: "Task",
  type: "Type",
  answered: "Answered",
  difficulty: "Difficulty",
  discrimination: "Discrimination",
  averageTries: "Average tries",
  outcome: "Outcome",
} as const;

/**
 * Two tables in one file, separated by a blank line: learners then items.
 *
 * Spreadsheets import that as one sheet with a gap, which is what a teacher
 * wants far more often than two downloads.
 */
export const toCsv = (
  statistics: GroupStatistics,
  reports: AttemptReport[],
  options: CsvOptions = {},
): string => {
  const h = { ...DEFAULT_HEADERS, ...options.headers };
  const items = statistics.items;
  const lines: string[] = [];

  lines.push(
    row([
      h.learner,
      h.rank,
      h.earned,
      h.possible,
      h.ratio,
      // Two columns per task: the score to compute with, and the outcome to
      // read. Neither substitutes for the other.
      ...items.flatMap((item) => [item.nodeId, `${item.nodeId} (${h.outcome})`]),
    ]),
  );

  for (const score of statistics.scores) {
    const report = reports.find((r) => r.attemptId === score.attemptId);
    lines.push(
      row([
        score.label,
        score.rank,
        score.earned,
        score.possible,
        score.ratio,
        ...items.flatMap((item) =>
          report
            ? [scoreFor(report, item.nodeId), outcomeFor(report, item.nodeId)]
            : [null, null],
        ),
      ]),
    );
  }

  lines.push("");
  lines.push(
    row([h.task, h.type, h.answered, h.difficulty, h.discrimination, h.averageTries]),
  );
  for (const item of items) {
    lines.push(
      row([
        item.nodeId,
        item.bitType,
        item.answered,
        item.difficulty,
        item.discrimination,
        item.averageTries,
      ]),
    );
  }

  return lines.join("\n");
};
