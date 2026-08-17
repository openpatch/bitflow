import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import { Fragment, useId, type ReactElement } from "react";
import { messages } from "./messages";
import {
  BLANK_PATTERN,
  blankIdsIn,
  type Answer,
  type BlankState,
  type Data,
} from "./schema";

/**
 * Splits `"a [[1]] b"` into the literal pieces and the blank ids between them,
 * so the text renders as prose with inputs sitting inside it rather than as a
 * separate list of gaps.
 */
const segments = (text: string): Array<{ text: string } | { blank: string }> => {
  const parts: Array<{ text: string } | { blank: string }> = [];
  let last = 0;
  for (const match of text.matchAll(BLANK_PATTERN)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ blank: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
};

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const id = useId();
  const states = (result?.detail?.blanks ?? {}) as Record<string, BlankState>;

  const setBlank = (blank: string, value: string) =>
    onAnswerChange({ blanks: { ...answer?.blanks, [blank]: value } });

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />

      <p className="bitflow-blank-text">
        {segments(data.text).map((segment, index) =>
          "text" in segment ? (
            <Fragment key={index}>{segment.text}</Fragment>
          ) : (
            <span key={index} className="bitflow-blank-wrapper">
              <input
                type="text"
                id={`${id}-${segment.blank}`}
                className={stateClass(states[segment.blank])}
                // Numbered so a screen reader announces which gap this is; the
                // surrounding sentence is not a usable label on its own.
                aria-label={translate(messages, "blankAriaLabel", locale, {
                  number: segment.blank,
                })}
                size={Math.max(8, longestAccepted(data, segment.blank))}
                value={answer?.blanks?.[segment.blank] ?? ""}
                disabled={readonly}
                onChange={(event) => setBlank(segment.blank, event.target.value)}
              />
              {states[segment.blank] && states[segment.blank] !== "neutral" && (
                <span className="bitflow-visually-hidden">
                  {translate(messages, states[segment.blank], locale)}
                </span>
              )}
            </span>
          ),
        )}
      </p>
    </div>
  );
};

const stateClass = (state?: BlankState): string =>
  state && state !== "neutral"
    ? `bitflow-input bitflow-blank bitflow-blank-${state}`
    : "bitflow-input bitflow-blank";

/** Sizes the input to the answer, so the gap does not give the length away. */
const longestAccepted = (data: Data, blank: string): number =>
  (data.blanks[blank] ?? []).reduce((max, value) => Math.max(max, value.length), 0);

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const ids = blankIdsIn(data.text);

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <TextAreaField
        label={t("textLabel")}
        hint={t("textHint")}
        rows={5}
        value={data.text}
        error={errorFor(errors, "text")}
        onChange={(text) => patch({ text })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("blanksLabel")}</legend>
        <span className="bitflow-hint">{t("blanksHint")}</span>

        {ids.length === 0 ? (
          <p className="bitflow-hint">{t("noBlanks")}</p>
        ) : (
          ids.map((blankId) => (
            <TextAreaField
              key={blankId}
              label={t("blankLabel", { number: blankId })}
              rows={2}
              value={(data.blanks[blankId] ?? []).join("\n")}
              error={errorFor(errors, `blanks.${blankId}`)}
              onChange={(value) =>
                patch({
                  blanks: { ...data.blanks, [blankId]: value.split("\n") },
                })
              }
            />
          ))
        )}
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("caseSensitiveLabel")}
          checked={data.caseSensitive}
          onChange={(caseSensitive) => patch({ caseSensitive })}
        />
        <CheckboxField
          label={t("trimLabel")}
          checked={data.trim}
          onChange={(trim) => patch({ trim })}
        />
        <CheckboxField
          label={t("partialCreditLabel")}
          hint={t("partialCreditHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
        />
        <SelectField
          label={t("modeLabel")}
          value={data.evaluation.mode}
          options={[
            { value: "auto", label: t("modeAuto") },
            { value: "manual", label: t("modeManual") },
            { value: "skip", label: t("modeSkip") },
          ]}
          onChange={(mode) => patch({ evaluation: { ...data.evaluation, mode } })}
        />
        {data.evaluation.mode === "auto" && (
          <>
            <CheckboxField
              label={t("retryLabel")}
              checked={data.evaluation.enableRetry}
              onChange={(enableRetry) =>
                patch({ evaluation: { ...data.evaluation, enableRetry } })
              }
            />
            <CheckboxField
              label={t("showFeedbackLabel")}
              checked={data.evaluation.showFeedback}
              onChange={(showFeedback) =>
                patch({ evaluation: { ...data.evaluation, showFeedback } })
              }
            />
          </>
        )}
      </Disclosure>
    </div>
  );
};
