import { translate, type Locale } from "@bitflow/core";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import type { Measurement } from "./evaluate";
import { messages } from "./messages";
import type { Answer, Data } from "./schema";

/**
 * The passage, and a box to type it into.
 *
 * Every character of the passage is marked as it is passed: right, wrong, or
 * not yet reached. Seeing the mistake where it happened is most of what makes
 * typing practice practice rather than testing.
 *
 * The text is read from the input's value on change, never from key events.
 * That is what makes the task work with an input method editor, where several
 * keystrokes compose one character and the keystrokes are not the text — and
 * it is also why there is no key-by-key record to keep: the component never
 * has one.
 */
export const Typist = ({
  data,
  answer,
  measurement,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** The measured result, once the answer has been checked. */
  measurement?: Measurement;
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  /** When the first character arrived, on the monotonic clock. */
  const startedAt = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  /*
   * The host's "try again" clears the result and keeps the answer, which is
   * right for an answer that is a draft and wrong for one that is the record
   * of a timed run: coming back with the passage already typed and the clock
   * already stopped leaves nothing to measure. Frozen back to live means: type
   * it again.
   */
  const wasFrozen = useRef(false);
  useEffect(() => {
    const frozen = readonly === true;
    if (wasFrozen.current && !frozen && answer.typed.length > 0 && !answer.optedOut) {
      startedAt.current = null;
      onChange({ typed: "", elapsedMs: 0, optedOut: false });
    }
    wasFrozen.current = frozen;
  });

  const type = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (readonly) return;
    const typed = event.target.value;

    // The clock starts at the first character, not when the box was focused:
    // reading the passage first is not time spent typing.
    if (startedAt.current === null && typed.length > 0) {
      startedAt.current = performance.now();
    }
    const elapsedMs =
      startedAt.current === null
        ? 0
        : Math.max(0, Math.round(performance.now() - startedAt.current));

    onChange({ ...answer, typed, elapsedMs });
  };

  const standDown = () => {
    onChange({ typed: "", elapsedMs: 0, optedOut: true });
    setAnnouncement(t("stoodDown"));
  };

  if (answer.optedOut) {
    return (
      <div className="bitflow-typing">
        <p className="bitflow-hint">{t("stoodDownNotice")}</p>
      </div>
    );
  }

  return (
    <div className="bitflow-typing">
      <p className="bitflow-hint">
        {readonly ? t("howToReadonly") : `${t("needsKeyboard")} ${t("howTo")}`}
      </p>

      {/* The passage, marked as it is passed. `aria-hidden` because it is the
          same text as the label on the box below, and hearing it twice —
          once letter by letter — would be worse than not seeing the marks. */}
      <p className="bitflow-typing-passage" aria-hidden="true">
        {[...data.text].map((character, index) => {
          const typed = answer.typed[index];
          const state =
            typed === undefined
              ? "pending"
              : typed === character
                ? "right"
                : "wrong";
          return (
            <span
              key={index}
              className={`bitflow-typing-character bitflow-typing-character-${state}`}
            >
              {character === " " && state === "wrong" ? "␣" : character}
            </span>
          );
        })}
      </p>

      <label className="bitflow-field">
        <span className="bitflow-label">{t("boxLabel")}</span>
        <textarea
          className="bitflow-typing-input"
          rows={4}
          value={answer.typed}
          disabled={readonly}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          /* No key handlers anywhere: the value is the text, whether it
             arrived one key at a time, from an input method composing several
             into one, or from a switch. */
          onChange={type}
        />
      </label>

      <p className="bitflow-typing-meters">
        {data.timed && (
          <span>
            {t("elapsed", { seconds: (answer.elapsedMs / 1000).toFixed(1) })}
          </span>
        )}
        <span>
          {t("typedCount", {
            typed: answer.typed.length,
            total: data.text.length,
          })}
        </span>
        {measurement && (
          <>
            <span>{t("accuracy", { percent: Math.round(measurement.accuracy * 100) })}</span>
            {data.timed && <span>{t("wpm", { wpm: Math.round(measurement.wpm) })}</span>}
          </>
        )}
      </p>

      {!readonly && data.allowOptOut && (
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={standDown}
          >
            {t("optOut")}
          </button>
          <span className="bitflow-hint">{t("optOutHint")}</span>
        </div>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
