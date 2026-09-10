import { translate, type Locale } from "@bitflow/core";
import type { ReactElement, ReactNode, RefObject } from "react";
import { messages } from "./messages";

/**
 * A thin, determinate progress bar. `<progress>` rather than a styled div: it
 * is announced as a progress bar, and it degrades to something meaningful if
 * the stylesheet never loads.
 */
export const Progress = ({
  visited,
  total,
  locale,
}: {
  visited: number;
  total: number;
  locale: Locale;
}): ReactElement => (
  <div className="bitflow-progress">
    <progress
      className="bitflow-progress-bar"
      max={Math.max(total, visited)}
      value={visited}
      aria-label={translate(messages, "progressLabel", locale)}
    />
    <span className="bitflow-visually-hidden">
      {translate(messages, "progressValue", locale, {
        visited,
        total: Math.max(total, visited),
      })}
    </span>
  </div>
);

const LEVELS = [1, 2, 3, 4, 5] as const;

/**
 * The five-point "how sure are you?" scale.
 *
 * A native radio group: the old version was clickable divs with `role="radio"`
 * and no arrow-key handling, so it could not actually be operated the way its
 * own ARIA role promised.
 */
export const ConfidenceLevels = ({
  value,
  locale,
  disabled,
  onChange,
}: {
  value?: number;
  locale: Locale;
  disabled?: boolean;
  onChange: (level: number) => void;
}): ReactElement => (
  <fieldset className="bitflow-confidence">
    <legend className="bitflow-label">
      {translate(messages, "confidenceLegend", locale)}
    </legend>
    <div className="bitflow-confidence-levels">
      {LEVELS.map((level) => {
        const label = translate(messages, `confidence${level}`, locale);
        return (
          <label
            key={level}
            className={`bitflow-confidence-level bitflow-confidence-level-${level}`}
            title={label}
          >
            <input
              type="radio"
              name="bitflow-confidence"
              className="bitflow-visually-hidden"
              checked={value === level / LEVELS.length}
              disabled={disabled}
              onChange={() => onChange(level / LEVELS.length)}
            />
            <span aria-hidden="true">{level}</span>
            <span className="bitflow-visually-hidden">{label}</span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export const Reasoning = ({
  value,
  locale,
  disabled,
  onChange,
}: {
  value?: string;
  locale: Locale;
  disabled?: boolean;
  onChange: (reasoning: string) => void;
}): ReactElement => (
  <div className="bitflow-field">
    <label className="bitflow-label" htmlFor="bitflow-reasoning">
      {translate(messages, "reasoningLabel", locale)}
    </label>
    <span className="bitflow-hint">
      {translate(messages, "reasoningHint", locale)}
    </span>
    <textarea
      id="bitflow-reasoning"
      className="bitflow-textarea"
      rows={3}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

/** One row of the step list, already turned into what it should read as. */
export type StepListItem = {
  nodeId: string;
  position: number;
  current: boolean;
  answered: boolean;
  outstanding: boolean;
  /** What the step is, for anyone who cannot see the numbers. */
  title: string;
};

/**
 * The list a flow set to free navigation shows: every step the learner has
 * been to, and which of them still has no answer.
 *
 * It is the check-your-work screen as much as it is navigation — the reason it
 * marks what is outstanding rather than only where they are. Numbers are for
 * the eye; each button carries its position, what the step was and its state in
 * its accessible name, because "3" on its own tells a screen reader nothing.
 */
export const StepList = ({
  steps,
  locale,
  onGoTo,
}: {
  steps: StepListItem[];
  locale: Locale;
  onGoTo: (nodeId: string) => void;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);

  return (
    <nav className="bitflow-steps" aria-label={t("stepsLabel")}>
      <p className="bitflow-hint">{t("stepsHint")}</p>
      <ol className="bitflow-steps-list">
        {steps.map((step) => {
          const state = step.current
            ? t("stepHere")
            : step.outstanding
              ? t("stepNotAnswered")
              : step.answered
                ? t("stepAnswered")
                : "";

          return (
            <li key={step.nodeId}>
              <button
                type="button"
                className={[
                  "bitflow-step",
                  step.current ? "bitflow-step-current" : "",
                  step.outstanding ? "bitflow-step-outstanding" : "",
                  step.answered ? "bitflow-step-answered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={step.current ? "step" : undefined}
                // Nowhere to go: they are already looking at it.
                disabled={step.current}
                onClick={() => onGoTo(step.nodeId)}
              >
                <span aria-hidden="true">{step.position}</span>
                <span className="bitflow-visually-hidden">
                  {/* Joined with full stops so a screen reader pauses between
                      the number, what the step was, and how it stands. */}
                  {[String(step.position), step.title, state]
                    .filter(Boolean)
                    .join(". ")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * The frame around whatever the learner is looking at: progress on top, the
 * bit in the middle, controls at the bottom. Every step of a flow uses it, so
 * the buttons never move between one task and the next.
 */
export const Shell = ({
  progress,
  children,
  controls,
  steps,
  contentRef,
  announcement,
}: {
  progress?: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  /** The step list, when the flow lets the learner move about freely. */
  steps?: ReactNode;
  contentRef?: RefObject<HTMLDivElement | null>;
  /** Read out when the learner arrives at a new step. */
  announcement?: string;
}): ReactElement => (
  <div className="bitflow-root bitflow-shell">
    {progress}
    {/* `tabIndex={-1}` so the runtime can put focus here on arrival: not a tab
        stop, but focusable on purpose. */}
    <div
      ref={contentRef}
      tabIndex={-1}
      className="bitflow-shell-content bitflow-content"
    >
      {children}
    </div>
    {controls && (
      <div className="bitflow-shell-controls bitflow-content">{controls}</div>
    )}
    {steps && <div className="bitflow-shell-steps bitflow-content">{steps}</div>}
    {/* Separate from the content so moving focus and announcing do not fight:
        the focus move reads the step, this says where in the flow it is. */}
    <div className="bitflow-visually-hidden" role="status">
      {announcement}
    </div>
  </div>
);
