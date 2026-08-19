import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { acceptedRange, type Reading } from "./evaluate";
import { parseQuantity } from "./expression";
import { formMessages } from "./formMessages";
import { AUTHOR_DIGITS, formatValue, NumericField } from "./NumericField";
import type { Answer, Data, ToleranceMode, UnitMode } from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => (
  <div className="bitflow-stack">
    <Markdown markdown={data.instruction} />
    <NumericField
      data={data}
      answer={{ input: answer?.input ?? "" }}
      reading={result?.detail as Reading | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

/** Feedback rules as the author edits them: `value: what to say`, one a line. */
const feedbackToLines = (entries: Data["valueFeedback"]): string =>
  entries.map((entry) => `${entry.value}: ${entry.feedback.message}`).join("\n");

const linesToFeedback = (text: string): Data["valueFeedback"] =>
  text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      // Split on the first colon only: the message is allowed to contain one,
      // the value never can.
      const at = line.indexOf(":");
      const value = at === -1 ? line : line.slice(0, at);
      const message = at === -1 ? "" : line.slice(at + 1);
      return {
        value: value.trim(),
        feedback: { message: message.trim(), severity: "info" as const },
      };
    });

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const expected = parseQuantity(data.expected, {
    decimalSeparator: data.decimalSeparator,
    allowExpression: true,
  });

  /**
   * What the setting the author just chose actually accepts, spelled out.
   *
   * A tolerance is two numbers away from being meaningful — "within 2%" of
   * what, and how much is that? — and an author who cannot see the range is
   * guessing. It is also the fastest way to notice that `expected` says
   * something other than what was meant.
   */
  const accepted = (): string | undefined => {
    if (!expected.ok) return undefined;
    const range = acceptedRange(expected.value, data);
    if (range) {
      return t("acceptedRange", {
        from: formatValue(range.from, locale, AUTHOR_DIGITS),
        to: formatValue(range.to, locale, AUTHOR_DIGITS),
      });
    }
    if (data.tolerance === "exact") {
      return t("acceptedExact", { value: formatValue(expected.value, locale, AUTHOR_DIGITS) });
    }
    return t("acceptedRounded", {
      value: formatValue(
        data.tolerance === "significant"
          ? Number(expected.value.toPrecision(Math.max(1, data.digits)))
          : Number(expected.value.toFixed(data.digits)),
        locale,
        AUTHOR_DIGITS,
      ),
    });
  };

  const toleranceOptions: Array<{ value: ToleranceMode; label: string }> = [
    { value: "exact", label: t("toleranceExact") },
    { value: "absolute", label: t("toleranceAbsolute") },
    { value: "percent", label: t("tolerancePercent") },
    { value: "decimals", label: t("toleranceDecimals") },
    { value: "significant", label: t("toleranceSignificant") },
  ];

  const unitOptions: Array<{ value: UnitMode; label: string }> = [
    { value: "none", label: t("unitModeNone") },
    { value: "shown", label: t("unitModeShown") },
    { value: "required", label: t("unitModeRequired") },
  ];

  const numberField = (
    label: string,
    value: number,
    onValue: (value: number) => void,
    options: { min: number; max?: number; step: number; error?: string },
  ) => (
    <Field label={label} error={options.error}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input"
          min={options.min}
          max={options.max}
          step={options.step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            onValue(Number.isFinite(next) ? Math.max(options.min, next) : options.min);
          }}
        />
      )}
    </Field>
  );

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <TextField
        label={t("expectedLabel")}
        hint={t("expectedHint")}
        value={data.expected}
        error={errorFor(errors, "expected")}
        onChange={(value) => patch({ expected: value })}
      />
      {data.expected.trim() !== "" && (
        <p className="bitflow-hint">
          {expected.ok
            ? t("expectedReads", { value: formatValue(expected.value, locale, AUTHOR_DIGITS) })
            : t("expectedUnreadable")}
        </p>
      )}

      <SelectField
        label={t("toleranceLabel")}
        value={data.tolerance}
        options={toleranceOptions}
        onChange={(tolerance) => patch({ tolerance })}
      />

      {(data.tolerance === "absolute" || data.tolerance === "percent") &&
        numberField(
          data.tolerance === "percent"
            ? t("tolerancePercentLabel")
            : t("toleranceValueLabel"),
          data.toleranceValue,
          (toleranceValue) => patch({ toleranceValue }),
          { min: 0, step: data.tolerance === "percent" ? 0.5 : 0.01, error: errorFor(errors, "toleranceValue") },
        )}

      {(data.tolerance === "decimals" || data.tolerance === "significant") &&
        numberField(
          data.tolerance === "significant"
            ? t("digitsSignificantLabel")
            : t("digitsDecimalsLabel"),
          data.digits,
          (digits) => patch({ digits: Math.round(digits) }),
          {
            min: data.tolerance === "significant" ? 1 : 0,
            max: 10,
            step: 1,
            error: errorFor(errors, "digits"),
          },
        )}

      {accepted() && <p className="bitflow-hint">{accepted()}</p>}

      <SelectField
        label={t("unitModeLabel")}
        value={data.unitMode}
        options={unitOptions}
        onChange={(unitMode) =>
          // Dropping the unit takes the mark for it away too, rather than
          // leaving a point behind that nothing can earn.
          patch({
            unitMode,
            scoring: unitMode === "required" ? data.scoring : "value",
          })
        }
      />

      {data.unitMode !== "none" && (
        <>
          <TextField
            label={t("unitLabel")}
            hint={t("unitHint")}
            value={data.unit}
            error={errorFor(errors, "unit")}
            onChange={(unit) => patch({ unit })}
          />
          <TextAreaField
            label={t("unitAlternativesLabel")}
            hint={t("unitAlternativesHint")}
            rows={2}
            value={data.unitAlternatives.join("\n")}
            onChange={(value) =>
              patch({
                unitAlternatives: value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line !== ""),
              })
            }
          />
        </>
      )}

      {/*
        The learner's own view, wired to nothing. An author reading the
        settings back as prose still cannot see that the unit is on the wrong
        side of the box or that the precision note reads oddly.
      */}
      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <NumericField
          data={data}
          answer={{ input: "" }}
          locale={locale}
          readonly
          onChange={() => undefined}
        />
      </div>

      <Disclosure summary={t("advanced")}>
        <SelectField
          label={t("scoringLabel")}
          value={data.scoring}
          options={[
            { value: "value" as const, label: t("scoringValue") },
            ...(data.unitMode === "required"
              ? [
                  {
                    value: "valueAndUnit" as const,
                    label: t("scoringValueAndUnit"),
                  },
                ]
              : []),
          ]}
          onChange={(scoring) => patch({ scoring })}
        />
        {errorFor(errors, "scoring") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "scoring")}
          </span>
        )}

        <SelectField
          label={t("separatorLabel")}
          hint={t("separatorHint")}
          value={data.decimalSeparator}
          options={[
            { value: "both" as const, label: t("separatorBoth") },
            { value: "point" as const, label: t("separatorPoint") },
            { value: "comma" as const, label: t("separatorComma") },
          ]}
          onChange={(decimalSeparator) => patch({ decimalSeparator })}
        />

        <CheckboxField
          label={t("expressionLabel")}
          hint={t("expressionHint")}
          checked={data.allowExpression}
          onChange={(allowExpression) => patch({ allowExpression })}
        />

        <TextAreaField
          label={t("feedbackLabel")}
          hint={t("feedbackHint")}
          rows={3}
          value={feedbackToLines(data.valueFeedback)}
          error={errorFor(errors, "valueFeedback")}
          onChange={(value) => patch({ valueFeedback: linesToFeedback(value) })}
        />

        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
