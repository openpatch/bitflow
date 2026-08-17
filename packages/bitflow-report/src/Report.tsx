import {
  formatDuration,
  resolveLocale,
  translate,
  type BitResultState,
} from "@bitflow/core";
import type { ReactElement } from "react";
import { messages } from "./messages";
import { parseReport, type AttemptReport } from "./report";
import { round } from "./stats";

export type ReportProps = {
  report?: AttemptReport | string;
  locale?: string;
  onError?: (message: string) => void;
};

/**
 * One learner's result: the score, and a row per task with its outcome,
 * attempts and time.
 *
 * The successor to the old `TaskResultState`/`InteractiveNodeStatus` views, but
 * driven purely by the raw report object — it needs no flow document, no bit
 * package and no runtime, which is what lets it be embedded on its own.
 */
export const Report = ({ report, locale, onError }: ReportProps): ReactElement => {
  const resolved = resolveLocale(locale);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, resolved, vars);

  if (report === undefined) {
    return <p className="bitflow-text-muted">{t("noReports")}</p>;
  }

  const parsed = parseReport(report);
  if (!parsed.ok) {
    onError?.(parsed.error.message);
    return (
      <div className="bitflow-alert bitflow-alert-error" role="alert">
        {t("invalidReport")}
      </div>
    );
  }

  const value = parsed.value;
  const duration =
    new Date(value.completedAt).getTime() - new Date(value.startedAt).getTime();

  return (
    <section className="bitflow-root bitflow-stack bitflow-content bitflow-report">
      <header className="bitflow-stack-small bitflow-stack">
        <h2 className="bitflow-heading">{t("reportHeading")}</h2>
        <p className="bitflow-report-score">
          {value.score && value.score.possible > 0
            ? t("score", {
                earned: round(value.score.earned),
                possible: value.score.possible,
              })
            : t("noScore")}
        </p>
        <p className="bitflow-text-muted">
          {t(value.status)}
          {Number.isFinite(duration) && duration > 0
            ? ` · ${t("duration", { duration: formatDuration(duration) })}`
            : ""}
        </p>
      </header>

      {value.nodeReports.length > 0 && (
        <div className="bitflow-table-scroll">
          <table className="bitflow-table">
            <thead>
              <tr>
                <th scope="col">{t("task")}</th>
                <th scope="col">{t("outcome")}</th>
                <th scope="col">{t("attempts")}</th>
                <th scope="col">{t("time")}</th>
              </tr>
            </thead>
            <tbody>
              {value.nodeReports.map((nodeReport, index) => {
                const state = (nodeReport.result?.state ?? "unknown") as BitResultState;
                return (
                  <tr key={nodeReport.nodeId}>
                    <th scope="row">{index + 1}</th>
                    <td>
                      <span className={`bitflow-state bitflow-state-${state}`}>
                        {t(state)}
                      </span>
                    </td>
                    <td>{nodeReport.tries}</td>
                    <td>
                      {nodeReport.elapsedMs === undefined
                        ? "—"
                        : formatDuration(nodeReport.elapsedMs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
