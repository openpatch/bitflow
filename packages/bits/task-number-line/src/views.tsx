import { parseExpression, translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import type { ItemStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { NumberLineView } from "./NumberLineView";
import { SNAP_MODES, type Answer, type Data, type Item, type SnapMode } from "./schema";

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
  const states = (result?.detail as { items?: ItemStates } | undefined)?.items;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>
      <NumberLineView
        data={data}
        answer={answer}
        states={states}
        locale={locale}
        readonly={readonly}
        onPlace={(itemId, value) => {
          onAnswerChange({ positions: { ...answer?.positions, [itemId]: value } });
        }}
      />
    </div>
  );
};

type InputProps = {
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  placeholder?: string;
};

/**
 * A number typed as an expression — "3/4", "sqrt(2)", "-1,5" — held as a
 * draft while it is typed. Held as text rather than committed on every
 * keystroke for the same reason as task-point-plot's `NumberInput`: "-",
 * "3." and "sqrt(" are all on the way to a value without parsing as one, and
 * a controlled field that only accepted finished numbers would throw each of
 * them away before the author got to finish typing.
 */
const ExpressionInput = ({
  value,
  onChange,
  ...props
}: InputProps & {
  value: number;
  onChange: (value: number) => void;
}): ReactElement => {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    const parsed = parseExpression(text);
    if (!parsed.ok || Math.abs(parsed.value - value) > 1e-9) setText(String(value));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="text"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parseExpression(event.target.value);
        if (parsed.ok) onChange(parsed.value);
      }}
    />
  );
};

/**
 * The same draft-holding idea as `ExpressionInput`, for a value that may be
 * left out on purpose — an item's tolerance override, or the line's own
 * tolerance falling back to a quarter of the tick spacing. Blank means
 * `undefined`, not zero: a tolerance of nothing is not the same question as
 * no override at all.
 */
const OptionalExpressionInput = ({
  value,
  onChange,
  ...props
}: InputProps & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}): ReactElement => {
  const [text, setText] = useState(() => (value === undefined ? "" : String(value)));

  useEffect(() => {
    if (value === undefined) return;
    const parsed = parseExpression(text);
    if (!parsed.ok || Math.abs(parsed.value - value) > 1e-9) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="text"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (next.trim() === "") {
          onChange(undefined);
          return;
        }
        const parsed = parseExpression(next);
        if (parsed.ok) onChange(parsed.value);
      }}
    />
  );
};

/** A fresh id that will not collide with one already in use. */
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

export const Form = ({ data, locale, onChange, errors }: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const setItem = (id: string, changes: Partial<Item>) =>
    patch({
      items: data.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });

  const addItem = () =>
    patch({
      items: [
        ...data.items,
        {
          id: newId("item", data.items.map((item) => item.id)),
          label: "",
          value: (data.min + data.max) / 2,
        },
      ],
    });

  const numberField = (
    label: string,
    value: number,
    set: (value: number) => void,
    error?: string,
    hint?: string,
  ) => (
    <Field label={label} error={error} hint={hint}>
      {(props) => (
        <ExpressionInput
          {...props}
          className="bitflow-input bitflow-number-line-number"
          value={value}
          onChange={set}
        />
      )}
    </Field>
  );

  const snapOptions: Array<{ value: SnapMode; label: string }> = SNAP_MODES.map((mode) => ({
    value: mode,
    label: t(mode === "none" ? "snapNone" : mode === "minor" ? "snapMinor" : "snapMajor"),
  }));

  // Every item at the position it is actually marked against, so the author
  // sees the line they authored rather than the one a learner might leave.
  const previewAnswer: Answer = {
    positions: Object.fromEntries(data.items.map((item) => [item.id, item.value])),
  };

  const itemErrors = [
    ...new Set(
      (errors ?? [])
        .filter((diagnostic) => /^items\.\d+\./.test(diagnostic.path))
        .map((diagnostic) => diagnostic.message),
    ),
  ];

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <div className="bitflow-row">
        {numberField(t("minLabel"), data.min, (min) => patch({ min }))}
        {numberField(t("maxLabel"), data.max, (max) => patch({ max }), errorFor(errors, "max"))}
        {numberField(
          t("tickStepLabel"),
          data.tickStep,
          (tickStep) => patch({ tickStep }),
          errorFor(errors, "tickStep"),
          t("tickStepHint"),
        )}
        {numberField(
          t("minorTicksLabel"),
          data.minorTicks,
          (raw) => patch({ minorTicks: Math.min(10, Math.max(0, Math.round(raw))) }),
          undefined,
          t("minorTicksHint"),
        )}
      </div>

      <CheckboxField
        label={t("labelTicksLabel")}
        hint={t("labelTicksHint")}
        checked={data.labelTicks}
        onChange={(labelTicks) => patch({ labelTicks })}
      />

      <SelectField
        label={t("snapLabel")}
        value={data.snap}
        options={snapOptions}
        onChange={(snap) => patch({ snap })}
      />

      <Field label={t("toleranceLabel")} hint={t("toleranceHint")}>
        {(props) => (
          <OptionalExpressionInput
            {...props}
            className="bitflow-input bitflow-number-line-number"
            value={data.tolerance}
            onChange={(tolerance) => patch({ tolerance })}
          />
        )}
      </Field>

      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <span className="bitflow-hint">{t("previewHint")}</span>
        <NumberLineView data={data} answer={previewAnswer} locale={locale} readonly />
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("itemsLabel")}</legend>
        <span className="bitflow-hint">{t("itemsHint")}</span>
        {errorAt(errors, "items") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "items")}
          </span>
        )}
        {itemErrors.map((message) => (
          <span key={message} className="bitflow-field-error" role="alert">
            {message}
          </span>
        ))}
        {data.items.length === 0 && <p className="bitflow-text-muted">{t("noItems")}</p>}
        {data.items.map((item, index) => {
          const position = index + 1;
          const name = item.label || t("unnamedItem", { number: position });
          return (
            <div key={item.id} className="bitflow-number-line-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={item.label}
                placeholder={t("itemLabelPlaceholder")}
                aria-label={t("itemLabelOf", { position })}
                aria-invalid={errorFor(errors, `items.${index}.label`) ? true : undefined}
                onChange={(event) => setItem(item.id, { label: event.target.value })}
              />
              <ExpressionInput
                className="bitflow-input bitflow-number-line-number"
                value={item.value}
                aria-label={t("itemValueOf", { position })}
                aria-invalid={errorFor(errors, `items.${index}.value`) ? true : undefined}
                onChange={(value) => setItem(item.id, { value })}
              />
              <OptionalExpressionInput
                className="bitflow-input bitflow-number-line-number"
                value={item.tolerance}
                placeholder={t("toleranceLabel")}
                aria-label={t("itemToleranceOf", { position })}
                onChange={(tolerance) => setItem(item.id, { tolerance })}
              />
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removeItemOf", { label: name })}
                onClick={() => patch({ items: data.items.filter((other) => other.id !== item.id) })}
              >
                ✕
              </button>
            </div>
          );
        })}
        <span className="bitflow-hint">{t("itemToleranceHint")}</span>
        <div className="bitflow-row">
          <button type="button" className="bitflow-button bitflow-button-secondary" onClick={addItem}>
            {t("addItem")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
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
