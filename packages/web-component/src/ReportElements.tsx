import {
  GroupReport,
  Report,
  type AttemptReport,
} from "@bitflow/report";
import r2wc from "@r2wc/react-to-web-component";
import { define, emitError } from "./dom";

/**
 * `<bitflow-report>` and `<bitflow-group-report>`.
 *
 * Neither touches the flow runtime, the editor or any bit package: they render
 * from the raw result data they are handed and nothing else. That is what lets
 * a page drop in a class overview without loading an assessment engine, and
 * `bitflow-report`'s own bundle test keeps it that way.
 */

type ReportElementProps = {
  container?: HTMLElement;
  report?: AttemptReport | string;
  locale?: string;
};

const ReportElement = ({ container, report, locale }: ReportElementProps) => (
  <Report
    report={report}
    locale={locale}
    onError={(message) =>
      emitError(container, { code: "INVALID_ATTEMPT", message })
    }
  />
);

type GroupReportElementProps = {
  container?: HTMLElement;
  reports?: AttemptReport[] | string;
  locale?: string;
};

const GroupReportElement = ({
  container,
  reports,
  locale,
}: GroupReportElementProps) => (
  <GroupReport
    reports={reports}
    locale={locale}
    onError={(message) =>
      emitError(container, { code: "INVALID_ATTEMPT", message })
    }
  />
);

export const defineReportElements = (): void => {
  define(
    "bitflow-report",
    r2wc(ReportElement, { props: { report: "json", locale: "string" } }),
  );
  define(
    "bitflow-group-report",
    r2wc(GroupReportElement, { props: { reports: "json", locale: "string" } }),
  );
};
