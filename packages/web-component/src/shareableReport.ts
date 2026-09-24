import type { AttemptSnapshot, BitflowDocument } from "@bitflow/core";
import { createReport, type AttemptReport } from "@bitflow/report";

/** A node report with the learner's answer taken out. */
export type ShareableNodeReport = Omit<AttemptReport["nodeReports"][number], "answer">;

/** An attempt's report with every answer taken out. */
export type ShareableReport = Omit<AttemptReport, "nodeReports"> & {
  nodeReports: ShareableNodeReport[];
};

/**
 * An attempt's report as it may leave the learner's browser: results, scores,
 * tries and timings, and never the answer itself.
 *
 * For a page that runs a flow with a class — a teacher's board, a live
 * session — where the teacher needs to know how each learner is doing but not
 * what they typed. The answer is removed here, where the report is made,
 * rather than trusted to every page that sends one; a receiving server should
 * still refuse a node report with an `answer` key in it, since a page can be
 * changed by the person using it.
 */
export const createShareableReport = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  subject?: { id?: string; label?: string },
): ShareableReport => {
  const report = createReport(doc, snapshot, subject);
  return {
    ...report,
    nodeReports: report.nodeReports.map(({ answer: _answer, ...rest }) => rest),
  };
};
