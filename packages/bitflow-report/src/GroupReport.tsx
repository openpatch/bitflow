import { formatDuration, resolveLocale, translate } from "@bitflow/core";
import { useMemo, type ReactElement } from "react";
import { computeGroupStatistics } from "./group";
import { messages } from "./messages";
import { parseReports, type AttemptReport } from "./report";
import { round } from "./stats";

export type GroupReportProps = {
  reports?: AttemptReport[] | string;
  locale?: string;
  onError?: (message: string) => void;
};

/**
 * The cohort view: per task, then per learner, then the distribution.
 *
 * Everything is computed here in the browser from the array it is handed. The
 * successor to the old `stats` package's `table`/`summary` views.
 */
export const GroupReport = ({
  reports,
  locale,
  onError,
}: GroupReportProps): ReactElement => {
  const resolved = resolveLocale(locale);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, resolved, vars);

  const parsed = useMemo(
    () => (reports === undefined ? undefined : parseReports(reports)),
    [reports],
  );

  const statistics = useMemo(
    () => (parsed?.ok ? computeGroupStatistics(parsed.value) : undefined),
    [parsed],
  );

  if (parsed === undefined) {
    return <p className="bitflow-text-muted">{t("noReports")}</p>;
  }
  if (!parsed.ok) {
    onError?.(parsed.error.message);
    return (
      <div className="bitflow-alert bitflow-alert-error" role="alert">
        {t("invalidReport")}
      </div>
    );
  }
  if (!statistics || statistics.learners === 0) {
    return <p className="bitflow-text-muted">{t("noReports")}</p>;
  }

  return (
    <section className="bitflow-root bitflow-stack bitflow-content bitflow-report">
      <header className="bitflow-stack-small bitflow-stack">
        <h2 className="bitflow-heading">{t("groupHeading")}</h2>
        <p className="bitflow-text-muted">
          {t("learners", { count: statistics.learners })}
        </p>
      </header>

      <dl className="bitflow-stat-row">
        <Stat
          label={t("reliability")}
          hint={t("reliabilityHint")}
          value={
            statistics.cronbachsAlpha === null
              ? t("notEnoughData")
              : String(round(statistics.cronbachsAlpha))
          }
        />
        {statistics.summary && (
          <>
            <Stat label={t("mean")} value={String(round(statistics.summary.mean))} />
            <Stat
              label={t("median")}
              value={String(round(statistics.summary.median))}
            />
            <Stat
              label={t("range")}
              value={`${round(statistics.summary.min)} – ${round(statistics.summary.max)}`}
            />
            <Stat
              label={t("standardDeviation")}
              value={String(round(statistics.summary.standardDeviation))}
            />
          </>
        )}
      </dl>

      <section className="bitflow-stack-small bitflow-stack">
        <h3 className="bitflow-heading">{t("itemsHeading")}</h3>
        <p className="bitflow-hint">{t("difficultyHint")}</p>
        <div className="bitflow-table-scroll">
          <table className="bitflow-table">
            <thead>
              <tr>
                <th scope="col">{t("task")}</th>
                <th scope="col">{t("difficulty")}</th>
                <th scope="col">{t("discrimination")}</th>
                <th scope="col">{t("correct")}</th>
                <th scope="col">{t("wrong")}</th>
                <th scope="col">{t("attempts")}</th>
                <th scope="col">{t("time")}</th>
              </tr>
            </thead>
            <tbody>
              {statistics.items.map((item, index) => (
                <tr key={item.nodeId}>
                  <th scope="row">{index + 1}</th>
                  <td>{Math.round(item.difficulty * 100)}%</td>
                  <td>
                    {item.discrimination === null
                      ? "—"
                      : round(item.discrimination)}
                  </td>
                  <td>{item.counts.correct}</td>
                  <td>{item.counts.wrong}</td>
                  <td>{round(item.averageTries, 1)}</td>
                  <td>
                    {item.averageElapsedMs === null
                      ? "—"
                      : formatDuration(item.averageElapsedMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bitflow-stack-small bitflow-stack">
        <h3 className="bitflow-heading">{t("scoresHeading")}</h3>
        <div className="bitflow-table-scroll">
          <table className="bitflow-table">
            <thead>
              <tr>
                <th scope="col">{t("learner")}</th>
                <th scope="col">{t("reportHeading")}</th>
                <th scope="col">{t("rank")}</th>
              </tr>
            </thead>
            <tbody>
              {statistics.scores.map((score) => (
                <tr key={score.attemptId}>
                  <th scope="row">{score.label}</th>
                  <td>
                    {t("score", {
                      earned: round(score.earned),
                      possible: score.possible,
                    })}
                  </td>
                  <td>{score.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="bitflow-stat">
    <dt className="bitflow-stat-label" title={hint}>
      {label}
    </dt>
    <dd className="bitflow-stat-value">{value}</dd>
  </div>
);
