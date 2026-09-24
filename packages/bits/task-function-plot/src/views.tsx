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
import { useEffect, useState, type ReactElement } from "react";
import type { HandleStates } from "./evaluate";
import { handleKey } from "./evaluate";
import { evaluateFormulaAt } from "./formula";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { NumberInput } from "./NumberInput";
import { defaultHandles } from "./plot";
import { PlotView } from "./PlotView";
import { SNAPS, type Answer, type Axis, type Data, type Snap } from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const states = (result?.detail as { handles?: HandleStates } | undefined)?.handles;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>
      <PlotView
        data={data}
        answer={answer}
        states={states}
        locale={locale}
        readonly={readonly}
        onSet={(x, value) =>
          onAnswerChange({ values: { ...answer?.values, [handleKey(x)]: value } })
        }
      />
    </div>
  );
};

/** A fresh id is not needed for `shown` rows — they carry no id of their own,
 *  addressed purely by index, which is fine for a list only ever appended to
 *  or removed from by a click right next to the row in question. */

/** A comma-separated list of x positions, edited as text.
 *
 * Keeps its own draft while the author types, on the same reasoning as
 * task-array-steps's `ValuesField`: parsed and redrawn on every keystroke,
 * typing "1, " would lose its trailing comma the instant it appeared — the
 * empty entry after it is dropped by `asHandleList` — and a second value could
 * never be started. The draft resets from outside only when the parsed list it
 * stands for actually changed.
 */
const HandlesField = ({
  handles,
  error,
  onChange,
  t,
}: {
  handles: number[];
  error?: string;
  onChange: (handles: number[]) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}): ReactElement => {
  const asLine = (values: number[]): string => values.map((x) => String(x)).join(", ");
  const asList = (text: string): number[] =>
    text
      .split(",")
      .map((part) => part.trim().replace(",", "."))
      .filter((part) => part.length > 0)
      .map(Number)
      .filter((value) => Number.isFinite(value));

  const [text, setText] = useState(() => asLine(handles));

  useEffect(() => {
    if (asList(text).join("\u0000") !== handles.join("\u0000")) setText(asLine(handles));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handles]);

  return (
    <TextField
      label={t("handlesLabel")}
      hint={t("handlesHint")}
      error={error}
      value={text}
      onChange={(next) => {
        setText(next);
        onChange(asList(next));
      }}
    />
  );
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const [spreadCount, setSpreadCount] = useState(5);

  const setAxis = (which: "x" | "y", changes: Partial<Axis>) =>
    patch({ axes: { ...data.axes, [which]: { ...data.axes[which], ...changes } } });

  const setShown = (index: number, changes: Partial<Data["shown"][number]>) =>
    patch({
      shown: data.shown.map((curve, i) => (i === index ? { ...curve, ...changes } : curve)),
    });

  const numberField = (
    label: string,
    value: number,
    set: (value: number) => void,
    error?: string,
  ) => (
    <Field label={label} error={error}>
      {(props) => (
        <NumberInput
          {...props}
          className="bitflow-input bitflow-function-plot-number"
          value={value}
          onChange={set}
        />
      )}
    </Field>
  );

  const axisFields = (which: "x" | "y") => (
    <fieldset className="bitflow-field">
      <legend className="bitflow-label">{t(which === "x" ? "xAxisLegend" : "yAxisLegend")}</legend>
      <div className="bitflow-row">
        <Field label={t("axisLabelField")}>
          {(props) => (
            <input
              {...props}
              type="text"
              className="bitflow-input"
              value={data.axes[which].label}
              onChange={(event) => setAxis(which, { label: event.target.value })}
            />
          )}
        </Field>
        {numberField(t("axisMinField"), data.axes[which].min, (min) => setAxis(which, { min }))}
        {numberField(
          t("axisMaxField"),
          data.axes[which].max,
          (max) => setAxis(which, { max }),
          errorFor(errors, `axes.${which}.max`),
        )}
        {numberField(
          t("axisStepField"),
          data.axes[which].step,
          (step) => setAxis(which, { step }),
          errorFor(errors, `axes.${which}.step`),
        )}
      </div>
    </fieldset>
  );

  // Handed to the preview instead of a real answer: each handle placed at the
  // target's own value there, so the author sees the curve they described
  // rather than the empty plot a learner would start from. A handle where the
  // target does not currently evaluate (mid-typo) is simply left out, drawn
  // hollow like any other unset handle.
  const previewAnswer: Answer = {
    values: Object.fromEntries(
      data.handles.flatMap((x) => {
        const result = evaluateFormulaAt(data.target, x);
        return result.ok ? [[handleKey(x), result.value] as const] : [];
      }),
    ),
  };

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      {axisFields("x")}
      {axisFields("y")}

      <TextField
        label={t("targetLabel")}
        hint={t("targetHint")}
        error={errorFor(errors, "target")}
        value={data.target}
        onChange={(target) => patch({ target })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("shownLabel")}</legend>
        <span className="bitflow-hint">{t("shownHint")}</span>
        {data.shown.length === 0 && <p className="bitflow-text-muted">{t("noShown")}</p>}
        {data.shown.map((curve, index) => (
          <div key={index} className="bitflow-stack-small">
            <div className="bitflow-function-plot-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={curve.expression}
                placeholder={t("shownExpressionPlaceholder")}
                aria-label={t("shownExpressionOf", { position: index + 1 })}
                aria-invalid={
                  errorFor(errors, `shown.${index}.expression`) ? true : undefined
                }
                onChange={(event) => setShown(index, { expression: event.target.value })}
              />
              <input
                type="text"
                className="bitflow-input"
                value={curve.label}
                placeholder={t("shownLabelPlaceholder")}
                aria-label={t("shownLabelOf", { position: index + 1 })}
                onChange={(event) => setShown(index, { label: event.target.value })}
              />
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removeShownOf", { position: index + 1 })}
                onClick={() => patch({ shown: data.shown.filter((_, i) => i !== index) })}
              >
                ✕
              </button>
            </div>
            {errorFor(errors, `shown.${index}.expression`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `shown.${index}.expression`)}
              </span>
            )}
          </div>
        ))}
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => patch({ shown: [...data.shown, { expression: "", label: "" }] })}
          >
            {t("addShown")}
          </button>
        </div>
      </fieldset>

      <div className="bitflow-field">
        <HandlesField
          handles={data.handles}
          error={errorFor(errors, "handles")}
          onChange={(handles) => patch({ handles })}
          t={t}
        />
        <div className="bitflow-row">
          <Field label={t("spreadCountLabel")}>
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                max={15}
                step={1}
                className="bitflow-input bitflow-function-plot-number"
                value={spreadCount}
                onChange={(event) => {
                  const next = Math.trunc(Number(event.target.value));
                  if (next >= 1 && next <= 15) setSpreadCount(next);
                }}
              />
            )}
          </Field>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => patch({ handles: defaultHandles(data.axes.x, spreadCount) })}
          >
            {t("spreadApply")}
          </button>
        </div>
      </div>

      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <span className="bitflow-hint">{t("previewHint")}</span>
        <PlotView data={data} answer={previewAnswer} locale={locale} revealTarget />
      </div>

      <Disclosure summary={t("advanced")}>
        <Field label={t("toleranceLabel")} hint={t("toleranceHint")}>
          {(props) => (
            <NumberInput
              {...props}
              className="bitflow-input bitflow-function-plot-number"
              value={data.tolerance}
              onChange={(tolerance) => patch({ tolerance })}
            />
          )}
        </Field>
        <SelectField
          label={t("snapLabel")}
          hint={t("snapHint")}
          value={data.snap}
          options={SNAPS.map((snap: Snap) => ({ value: snap, label: t(`snap-${snap}`) }))}
          onChange={(snap) => patch({ snap })}
        />
        <CheckboxField
          label={t("partialCreditLabel")}
          hint={t("partialCreditHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
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
