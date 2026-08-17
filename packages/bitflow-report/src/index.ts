import { injectStyles } from "@bitflow/core";
import styles from "./report.css?inline";

export { GroupReport, type GroupReportProps } from "./GroupReport";
export {
  computeGroupStatistics,
  type GroupStatistics,
  type ItemStatistics,
  type LearnerScore,
} from "./group";
export { messages as reportMessages } from "./messages";
export { Report, type ReportProps } from "./Report";
export {
  AttemptReportSchema,
  createReport,
  NodeReportSchema,
  parseReport,
  parseReports,
  REPORT_SCHEMA_VERSION,
  type AttemptReport,
  type NodeReport,
} from "./report";

injectStyles("bitflow-styles-report", styles);
export * from "./stats";
