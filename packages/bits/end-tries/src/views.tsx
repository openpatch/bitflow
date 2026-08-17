import {
  computeScore,
  translate,
  type AttemptSnapshot,
  type BitFormProps,
  type BitResultState,
  type BitTaskProps,
  type Locale,
} from "@bitflow/core";
import {
  CheckboxField,
  Markdown,
  StateIcon,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";
import type { Data } from "./schema";

/**
 * The closing screen.
 *
 * The per-task breakdown is built from the attempt the flow hands in. When the
 * bit is rendered standalone there is no attempt, so only the message shows —
 * which is the right thing for an author previewing the closing text.
 */
export const Task = ({
  data,
  locale,
  attempt,
}: BitTaskProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  return (
    <div className="bitflow-stack">
      {data.title && <h2 className="bitflow-heading">{data.title}</h2>}
      <Markdown markdown={data.markdown} />

      {attempt && data.showScore && <Score attempt={attempt} locale={locale} />}
      {attempt && data.showBreakdown && (
        <Breakdown attempt={attempt} locale={locale} />
      )}
      {attempt && data.showBreakdown && countTasks(attempt) === 0 && (
        <p className="bitflow-text-muted">{t("noTasks")}</p>
      )}
    </div>
  );
};

const Score = ({
  attempt,
  locale,
}: {
  attempt: AttemptSnapshot;
  locale: Locale;
}) => {
  const score = computeScore(attempt);
  if (score.possible === 0) return null;

  return (
    <p className="bitflow-end-score">
      {translate(messages, "score", locale, {
        // Partial credit produces fractions; two decimals is as fine as anyone
        // reads a score.
        earned: Math.round(score.earned * 100) / 100,
        possible: score.possible,
      })}
    </p>
  );
};

const Breakdown = ({
  attempt,
  locale,
}: {
  attempt: AttemptSnapshot;
  locale: Locale;
}) => {
  const entries = Object.entries(attempt.results);
  if (entries.length === 0) return null;

  return (
    <section className="bitflow-stack-small bitflow-stack">
      <h3 className="bitflow-heading">
        {translate(messages, "summaryHeading", locale)}
      </h3>
      <ol className="bitflow-end-list">
        {entries.map(([nodeId, result], index) => {
          const state = result.state as BitResultState;
          const tries = attempt.tries[nodeId] ?? 0;
          return (
            <li key={nodeId} className="bitflow-end-item">
              <span className="bitflow-end-index">{index + 1}</span>
              <span className={`bitflow-state bitflow-state-${state}`}>
                <StateIcon state={state} />
                {translate(messages, state, locale)}
              </span>
              {tries > 1 && (
                <span className="bitflow-text-muted">
                  {translate(messages, "attempts", locale, { count: tries })}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const countTasks = (attempt: AttemptSnapshot): number =>
  Object.keys(attempt.results).length;

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  return (
    <div className="bitflow-stack">
      <TextField
        label={t("titleLabel")}
        value={data.title}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TextAreaField
        label={t("markdownLabel")}
        hint={t("markdownHint")}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />
      <CheckboxField
        label={t("showScoreLabel")}
        checked={data.showScore}
        onChange={(showScore) => onChange({ ...data, showScore })}
      />
      <CheckboxField
        label={t("showBreakdownLabel")}
        hint={t("showBreakdownHint")}
        checked={data.showBreakdown}
        onChange={(showBreakdown) => onChange({ ...data, showBreakdown })}
      />
    </div>
  );
};
