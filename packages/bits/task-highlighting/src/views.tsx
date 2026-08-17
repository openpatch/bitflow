import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { Highlighter } from "./Highlighter";
import { messages } from "./messages";
import { COLORS, type Answer, type Color, type Data } from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const agreement = (result?.detail?.agreement ?? {}) as Partial<
    Record<Color, number>
  >;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />

      <Highlighter
        text={data.text}
        highlights={answer?.highlights ?? []}
        colors={data.colors}
        locale={locale}
        readonly={readonly}
        onChange={(highlights) => onAnswerChange({ highlights })}
      />

      {/* After checking, say how close the learner got per colour. A bare
          "wrong" tells them nothing about a task where partial overlap is the
          whole point. */}
      {Object.keys(agreement).length > 0 && (
        <ul className="bitflow-highlight-agreement">
          {(Object.entries(agreement) as Array<[Color, number]>).map(
            ([color, value]) => (
              <li key={color}>
                <span className={`bitflow-highlight-${color}`}>
                  {data.colors[color]?.label || translate(messages, color, locale)}
                </span>{" "}
                {translate(messages, "agreementResult", locale, {
                  value: Math.round(value * 100) / 100,
                })}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const setColor = (color: Color, changes: Partial<{ enabled: boolean; label: string }>) =>
    patch({
      colors: {
        ...data.colors,
        [color]: {
          enabled: false,
          label: "",
          ...data.colors[color],
          ...changes,
        },
      },
    });

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
        rows={6}
        value={data.text}
        error={errorFor(errors, "text")}
        // Editing the text invalidates the reference marking, which is stored
        // per character. Clearing it is honest; silently keeping a misaligned
        // one would mark learners against the wrong words.
        onChange={(text) =>
          patch({
            text,
            reference: text === data.text ? data.reference : [],
          })
        }
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("colorsLabel")}</legend>
        <span className="bitflow-hint">{t("colorsHint")}</span>
        {errorFor(errors, "colors") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "colors")}
          </span>
        )}

        {COLORS.map((color) => (
          <div key={color} className="bitflow-highlight-color-row">
            <label className="bitflow-option">
              <input
                type="checkbox"
                checked={data.colors[color]?.enabled ?? false}
                onChange={(event) => setColor(color, { enabled: event.target.checked })}
              />
              <span className={`bitflow-highlight-${color}`}>
                {translate(messages, color, locale)}
              </span>
            </label>
            {data.colors[color]?.enabled && (
              <input
                type="text"
                className="bitflow-input"
                aria-label={`${translate(messages, color, locale)} — ${t("colorLabelPlaceholder")}`}
                placeholder={t("colorLabelPlaceholder")}
                value={data.colors[color]?.label ?? ""}
                onChange={(event) => setColor(color, { label: event.target.value })}
              />
            )}
          </div>
        ))}
      </fieldset>

      {data.text && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("referenceLabel")}</span>
          <span className="bitflow-hint">{t("referenceHint")}</span>
          {errorFor(errors, "reference") && (
            <span className="bitflow-field-error" role="alert">
              {errorFor(errors, "reference")}
            </span>
          )}
          {/* The same component the learner uses, so the teacher marks the text
              exactly the way it will be marked back. */}
          <Highlighter
            text={data.text}
            highlights={data.reference}
            colors={data.colors}
            locale={locale}
            onChange={(reference) => patch({ reference })}
          />
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        <fieldset className="bitflow-field">
          <legend className="bitflow-label">{t("agreementLabel")}</legend>
          <span className="bitflow-hint">{t("agreementHint")}</span>
          {COLORS.filter((color) => data.colors[color]?.enabled).map((color) => (
            <label key={color} className="bitflow-highlight-cutoff">
              <span>{data.colors[color]?.label || translate(messages, color, locale)}</span>
              <input
                type="number"
                className="bitflow-input"
                min={0}
                max={1}
                step={0.05}
                value={data.cutoffs[color] ?? 0.6}
                onChange={(event) =>
                  patch({
                    cutoffs: {
                      ...data.cutoffs,
                      [color]: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </fieldset>

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
