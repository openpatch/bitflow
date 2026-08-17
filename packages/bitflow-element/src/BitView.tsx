import {
  getBit,
  resolveLocale,
  translate,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitResult,
  type BitTaskProps,
  type Locale,
} from "@bitflow/core";
import type { ComponentType, ReactElement } from "react";
import { messages } from "./messages";

export type BitViewProps = {
  type: string;
  data: unknown;
  answer?: unknown;
  result?: BitResult;
  readonly?: boolean;
  locale?: string;
  onAnswerChange?: (answer: unknown) => void;
  /** Only `end` bits use it; see `BitTaskProps.attempt`. */
  attempt?: AttemptSnapshot;
  /** Paired with `attempt`; see `BitTaskProps.flow`. */
  flow?: BitflowDocument;
};

/**
 * Renders whichever bit is registered for `type`.
 *
 * This is the single rendering path: the standalone custom element wraps it,
 * and `<bitflow-flow>` renders it for the node the learner is on. Neither owns
 * a second copy of a bit's view.
 */
export const BitView = ({
  type,
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
  attempt,
  flow,
}: BitViewProps): ReactElement => {
  const resolved = resolveLocale(locale);
  const bit = getBit(type);

  if (!bit || !bit.Task) return <UnknownBit type={type} locale={resolved} />;

  // A document can outlive the schema it was authored against, and a host can
  // pass anything through the `data` property. Failing loudly here beats a bit
  // crashing on a field it assumed was present.
  const parsed = bit.schema.safeParse(data);
  if (!parsed.success) {
    return (
      <div className="bitflow-alert bitflow-alert-error" role="alert">
        <div>
          <strong>{translate(messages, "invalidData", resolved)}</strong>
          <ul className="bitflow-text-muted">
            {parsed.error.issues.slice(0, 5).map((issue, index) => (
              <li key={index}>
                {issue.path.join(".")}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const Task = bit.Task as ComponentType<BitTaskProps>;

  return (
    <Task
      data={parsed.data}
      answer={answer}
      result={result}
      readonly={readonly}
      locale={resolved}
      onAnswerChange={onAnswerChange ?? noop}
      attempt={attempt}
      flow={flow}
    />
  );
};

const noop = () => {};

/**
 * Shown when a document references a bit whose package was never imported —
 * the normal outcome of hand-editing a `.bitflow` file or of a lazy import
 * that failed. The learner sees an explanation instead of a blank space.
 */
const UnknownBit = ({ type, locale }: { type: string; locale: Locale }) => (
  <div className="bitflow-alert bitflow-alert-warning" role="alert">
    <div>
      <strong>{translate(messages, "unknownBit", locale)}</strong>
      <p className="bitflow-text-muted">
        {translate(messages, "unknownBitHelp", locale, { type })}
      </p>
    </div>
  </div>
);
