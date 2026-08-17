import {
  computeScore,
  translate,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitFormProps,
  type BitResultState,
  type BitTaskProps,
  type Locale,
} from "@bitflow/core";
import {
  BitView,
  CheckboxField,
  Markdown,
  StateIcon,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
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
  flow,
}: BitTaskProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  return (
    <div className="bitflow-stack">
      {data.title && <h2 className="bitflow-heading">{data.title}</h2>}
      <Markdown markdown={data.markdown} />

      {attempt && data.showScore && <Score attempt={attempt} locale={locale} />}
      {attempt && data.showBreakdown && (
        <Breakdown
          attempt={attempt}
          flow={flow}
          locale={locale}
          reviewable={data.allowReview}
        />
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
  flow,
  locale,
  reviewable,
}: {
  attempt: AttemptSnapshot;
  flow?: BitflowDocument;
  locale: Locale;
  reviewable: boolean;
}) => {
  /** Which task the learner has opened, if any. Only one at a time. */
  const [open, setOpen] = useState<string | null>(null);

  const entries = Object.entries(attempt.results);
  if (entries.length === 0) return null;

  // Reviewing needs the document: the snapshot has node ids and answers, but
  // only the flow knows which task each id was and how it was set up.
  const canReview = reviewable && flow !== undefined;
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  return (
    <section className="bitflow-stack-small bitflow-stack">
      <h3 className="bitflow-heading">{t("summaryHeading")}</h3>
      {canReview && <p className="bitflow-hint">{t("reviewHint")}</p>}

      <ol className="bitflow-end-list">
        {entries.map(([nodeId, result], index) => {
          const state = result.state as BitResultState;
          const tries = attempt.tries[nodeId] ?? 0;
          const node = flow?.nodes.find((n) => n.id === nodeId);
          const isOpen = open === nodeId;

          const summary = (
            <>
              <span className="bitflow-end-index">{index + 1}</span>
              <span className={`bitflow-state bitflow-state-${state}`}>
                <StateIcon state={state} />
                {t(state)}
              </span>
              {tries > 1 && (
                <span className="bitflow-text-muted">
                  {t("attempts", { count: tries })}
                </span>
              )}
            </>
          );

          return (
            <li key={nodeId} className="bitflow-end-item">
              {canReview && node ? (
                <>
                  <button
                    type="button"
                    className="bitflow-end-row bitflow-end-row-button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : nodeId)}
                  >
                    {summary}
                    <span className="bitflow-end-review">
                      {isOpen ? t("hideAnswer") : t("showAnswer")}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="bitflow-end-answer">
                      {/* The learner's own task, with their answer and its
                          result, and no way to change either. The same view
                          they answered in — not a summary of it. */}
                      <BitView
                        type={node.type}
                        data={node.data}
                        answer={attempt.answers[nodeId]}
                        result={result}
                        readonly
                        locale={locale}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="bitflow-end-row">{summary}</div>
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
      {data.showBreakdown && (
        <CheckboxField
          label={t("allowReviewLabel")}
          hint={t("allowReviewHint")}
          checked={data.allowReview}
          onChange={(allowReview) => onChange({ ...data, allowReview })}
        />
      )}
    </div>
  );
};
