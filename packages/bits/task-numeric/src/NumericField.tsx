import { translate, type Locale } from "@bitflow/core";
import { useId, type ReactElement } from "react";
import { read, type Reading } from "./evaluate";
import { messages } from "./messages";
import type { Answer, Data } from "./schema";

/**
 * How many figures a learner is shown. Enough that the number they are marked
 * on is the number in front of them, digit for digit.
 */
export const LEARNER_DIGITS = 12;

/**
 * How many an author is shown. Fewer on purpose: `2.15513256036 to
 * 2.24309715466` is exact and unreadable, and the question an author is asking
 * of that line — is the range about right? — is answered by `2.15513 to
 * 2.2431` and buried by the rest.
 */
export const AUTHOR_DIGITS = 6;

/**
 * A number the reader can read.
 *
 * `Intl` in the reader's own locale, so somebody who typed `0,75` is shown
 * `0,75` back rather than being quietly corrected to a decimal point they were
 * never asked to use. Very large and very small magnitudes fall back to
 * exponential notation, where the grouped form would be a wall of zeroes.
 */
export const formatValue = (
  value: number,
  locale: Locale,
  digits: number = LEARNER_DIGITS,
): string => {
  const magnitude = Math.abs(value);
  const notation =
    magnitude !== 0 && (magnitude >= 1e12 || magnitude < 1e-6)
      ? "scientific"
      : "standard";
  return new Intl.NumberFormat(locale, {
    notation,
    maximumSignificantDigits: digits,
  }).format(value);
};

/** The reading, as a sentence, or nothing when there is nothing to say. */
const readingNote = (
  reading: Reading,
  input: string,
  locale: Locale,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string => {
  if (input.trim() === "") return "";

  if (reading.error) {
    switch (reading.error) {
      case "empty":
        return "";
      case "tooLong":
        return t("tooLong");
      case "notFinite":
        return t("notFinite");
      case "expressionNotAllowed":
        return t("expressionNotAllowed");
      default:
        return t("cannotRead");
    }
  }

  if (reading.value === undefined) return "";
  const shown = formatValue(reading.value, locale);
  const unit = reading.unit === "" ? "" : ` ${reading.unit}`;

  // Only worth saying when it is not simply the text back again: echoing
  // `12` at somebody who typed `12` is noise, and a live region that says
  // something on every keystroke is worse than one that stays quiet.
  if (`${shown}${unit}` === input.trim()) return "";
  return t("readsAs", { value: `${shown}${unit}` });
};

/** What the author asked for beyond a number: precision, a unit, arithmetic. */
const requirements = (
  data: Data,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] => {
  const notes: string[] = [];

  // The precision that will be marked is never a secret. Rounding to three
  // figures when nobody said three is a trick, not a question.
  if (data.tolerance === "decimals") {
    notes.push(
      data.digits === 0
        ? t("hintDecimalsZero")
        : data.digits === 1
          ? t("hintDecimalsOne")
          : t("hintDecimals", { digits: data.digits }),
    );
  }
  if (data.tolerance === "significant") {
    notes.push(
      data.digits === 1
        ? t("hintSignificantOne")
        : t("hintSignificant", { digits: data.digits }),
    );
  }
  if (data.unitMode === "required") notes.push(t("hintUnitRequired"));
  if (data.allowExpression) notes.push(t("hintExpression"));

  return notes;
};

/**
 * The box, the unit beside it, and a running account of what the task makes of
 * what has been typed.
 *
 * Showing the reading matters more here than it looks: this is the one task
 * type where the thing marked is not the thing typed. `3/4` scores as `0.75`,
 * and a learner who is told so can tell the difference between getting the
 * arithmetic wrong and writing something the task could not read.
 */
export const NumericField = ({
  data,
  answer,
  reading,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** The marked reading, once the answer has been checked. */
  reading?: Reading;
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const id = useId();
  const unitId = `${id}-unit`;
  const hintId = `${id}-hint`;
  const live = read(data, answer.input);
  const note = readingNote(live, answer.input, locale, t);
  const notes = requirements(data, t);
  const showUnit = data.unitMode === "shown" && data.unit.trim() !== "";

  const marked = reading;
  const outcome =
    marked === undefined
      ? undefined
      : marked.valueCorrect && !marked.unitCorrect
        ? marked.unit === ""
          ? t("outcomeUnitMissing")
          : t("outcomeUnitWrong")
        : !marked.valueCorrect && marked.unitCorrect && marked.unit !== ""
          ? t("outcomeValueWrong")
          : undefined;

  return (
    <div className="bitflow-numeric">
      <div className="bitflow-field">
        <label className="bitflow-label" htmlFor={id}>
          {t("answerLabel")}
        </label>
        <div className="bitflow-numeric-entry">
          <input
            id={id}
            className="bitflow-numeric-input"
            type="text"
            /*
             * `text`, not `number`: a spinner cannot express `2*pi`, and
             * `type="number"` silently discards what it cannot parse — a
             * learner mid-way through typing `1.5e` would watch the box empty
             * itself. `inputMode` still brings up the right phone keyboard.
             */
            inputMode={data.allowExpression ? "text" : "decimal"}
            autoComplete="off"
            spellCheck={false}
            value={answer.input}
            disabled={readonly}
            placeholder={
              data.allowExpression ? t("placeholderExpression") : t("placeholder")
            }
            aria-describedby={
              [showUnit ? unitId : undefined, notes.length > 0 ? hintId : undefined]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onChange={(event) => onChange({ input: event.target.value })}
          />
          {showUnit && (
            <span className="bitflow-numeric-unit" id={unitId}>
              {data.unit}
            </span>
          )}
        </div>
        {notes.length > 0 && (
          <span className="bitflow-hint" id={hintId}>
            {notes.join(" ")}
          </span>
        )}
      </div>

      {/*
        Polite rather than assertive, and quiet when the reading is the text
        back again: this updates on every keystroke, and an assertive region
        here would interrupt the person typing into it.
      */}
      <p className="bitflow-numeric-reading" role="status" aria-live="polite">
        {note}
      </p>

      {outcome && <p className="bitflow-numeric-outcome">{outcome}</p>}
    </div>
  );
};
