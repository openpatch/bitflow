import {
  resolveLocale,
  translate,
  type BitResult,
  type BitResultState,
} from "@bitflow/core";
import type { ReactElement } from "react";
import { messages } from "./messages";

export type BitFeedbackProps = {
  result: BitResult;
  locale?: string;
  /** Attempt number to show alongside the outcome; omitted hides it. */
  tries?: number;
};

/**
 * The outcome of one evaluation: state, the bit's own feedback messages, and
 * which attempt it was.
 *
 * `role="status"` rather than `role="alert"` on purpose — being told you were
 * wrong should not interrupt a screen reader mid-sentence, and the result is
 * always reachable again by reading back through the page.
 */
export const BitFeedback = ({
  result,
  locale,
  tries,
}: BitFeedbackProps): ReactElement => {
  const resolved = resolveLocale(locale);
  const label = translate(messages, stateKey(result.state), resolved);

  return (
    <div className="bitflow-stack-small bitflow-stack" role="status">
      <div className="bitflow-row">
        <span className={`bitflow-state bitflow-state-${result.state}`}>
          <StateIcon state={result.state} />
          {label}
        </span>
        {tries !== undefined && tries > 1 && (
          <span className="bitflow-text-muted">
            {translate(messages, "tries", resolved, { count: tries })}
          </span>
        )}
      </div>

      {result.feedback?.map((message, index) => (
        <div
          key={index}
          className={`bitflow-alert bitflow-alert-${message.severity}`}
        >
          {message.message}
        </div>
      ))}
    </div>
  );
};

const stateKey = (state: BitResultState): string => state;

/**
 * The three result icons, inlined rather than pulled from the old
 * `@bitflow/icons` package — a handful of paths does not need a package.
 *
 * `aria-hidden` because the adjacent text already names the state; a screen
 * reader announcing "check mark Correct" is noise.
 */
export const StateIcon = ({ state }: { state: BitResultState }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {state === "correct" && <polyline points="3,8.5 6.5,12 13,4" />}
    {state === "wrong" && (
      <>
        <line x1="4" y1="4" x2="12" y2="12" />
        <line x1="12" y1="4" x2="4" y2="12" />
      </>
    )}
    {state === "unknown" && (
      <>
        <circle cx="8" cy="8" r="6" />
        <line x1="5.5" y1="8" x2="10.5" y2="8" />
      </>
    )}
  </svg>
);
