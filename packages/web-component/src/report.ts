import "@bitflow/report/index.css";
import { defineReportElements } from "./ReportElements";

/**
 * `<bitflow-report>` and `<bitflow-group-report>` on their own — the entry a
 * page uses when it only wants to show results.
 */
defineReportElements();

export { defineReportElements } from "./ReportElements";
