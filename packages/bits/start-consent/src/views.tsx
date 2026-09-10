import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { isDecided, type Answer, type Data } from "./schema";

/**
 * The screen before the assessment: what it records, and a choice about it.
 *
 * Two shapes, not one. When declining is allowed the choice is a radio group,
 * because "yes" and "no" are two answers and a lone unticked box does not say
 * which one silence means. When it is not, a single tick box is the honest
 * control: there is one way on, and the text above should have said so.
 */
export const Task = ({
  data,
  answer,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const agree = data.agreeLabel || t("agreeFallback");
  const decline = data.declineLabel || t("declineFallback");
  const decided = isDecided(data, answer);

  return (
    <div className="bitflow-stack">
      {data.title && <h1 className="bitflow-heading">{data.title}</h1>}
      <Markdown markdown={data.markdown} />

      {data.allowDecline ? (
        <fieldset className="bitflow-consent">
          <legend className="bitflow-label">{t("choiceLegend")}</legend>
          {[
            { value: true, label: agree },
            { value: false, label: decline },
          ].map((option) => (
            <label key={String(option.value)} className="bitflow-consent-option">
              <input
                type="radio"
                name="bitflow-consent"
                checked={answer === option.value}
                disabled={readonly}
                onChange={() => onAnswerChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="bitflow-consent-option">
          <input
            type="checkbox"
            checked={answer === true}
            disabled={readonly}
            onChange={(event) => onAnswerChange(event.target.checked)}
          />
          <span>{agree}</span>
        </label>
      )}

      {/* Why the Next button will not move. Above the button and before it in
          reading order, so the reason arrives before the dead control rather
          than after it — and always rendered, so choosing an answer does not
          shift the button up by a line just as they reach for it. */}
      <p className="bitflow-consent-required">
        {!decided && !readonly && (data.requiredHint || t("requiredFallback"))}
      </p>
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
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
        rows={6}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />
      <TextField
        label={t("agreeLabelLabel")}
        hint={t("agreeLabelHint")}
        value={data.agreeLabel}
        onChange={(agreeLabel) => onChange({ ...data, agreeLabel })}
      />
      <CheckboxField
        label={t("allowDeclineLabel")}
        hint={t("allowDeclineHint")}
        checked={data.allowDecline}
        onChange={(allowDecline) => onChange({ ...data, allowDecline })}
      />
      {data.allowDecline && (
        <TextField
          label={t("declineLabelLabel")}
          hint={t("declineLabelHint")}
          value={data.declineLabel}
          onChange={(declineLabel) => onChange({ ...data, declineLabel })}
        />
      )}
      <TextField
        label={t("requiredHintLabel")}
        hint={t("requiredHintHint")}
        value={data.requiredHint}
        onChange={(requiredHint) => onChange({ ...data, requiredHint })}
      />
    </div>
  );
};
