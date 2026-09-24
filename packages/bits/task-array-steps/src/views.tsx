import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
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
  TextField,
  usePanels,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import type { StepState } from "./evaluate";
import { formMessages } from "./formMessages";
import { StepsGrid } from "./Grid";
import type { Answer, Data, Mode, Step } from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const detail = result?.detail as
    | { rows: StepState["state"][]; diffs: boolean[][] }
    | undefined;
  const states: StepState[] | undefined = detail?.rows.map((state, index) => ({
    state,
    diffs: detail.diffs[index] ?? [],
  }));

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <StepsGrid
        data={data}
        answer={answer}
        states={states}
        readonly={readonly}
        locale={locale}
        onChange={onAnswerChange}
      />
    </div>
  );
};

/** A step's array, as one comma-separated line — how it is typed and shown in
 *  the authoring form, whatever `data.mode` will ask the learner to do. */
const asLine = (values: string[]): string => values.join(", ");

/** The reverse: blank entries dropped, so a stray comma or trailing space
 *  never becomes a phantom empty box in the answer key. */
const asValues = (text: string): string[] =>
  text
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

/**
 * A comma-separated list, edited as text. It keeps its own draft while the
 * author types: parsed and redrawn on every keystroke, "5, " would lose its
 * comma the instant it was typed — the empty entry after it is dropped — and a
 * second value could never be started. The draft is replaced from outside only
 * when the list it stands for really changed.
 */
const ValuesField = ({
  values,
  onChange,
  ...field
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  error?: string;
  values: string[];
  onChange: (values: string[]) => void;
}): ReactElement => {
  const [text, setText] = useState(() => asLine(values));

  useEffect(() => {
    if (asValues(text).join("\u0000") !== values.join("\u0000")) setText(asLine(values));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return (
    <TextField
      {...field}
      value={text}
      onChange={(next) => {
        setText(next);
        onChange(asValues(next));
      }}
    />
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `step-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** The live "here is what that parses to" line under a comma-separated field —
 *  so an author can see a stray space or an accidental double comma before it
 *  ever reaches a learner. */
const Parsed = ({
  values,
  t,
}: {
  values: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}): ReactElement => (
  <p className="bitflow-text-muted">
    {values.length > 0
      ? t("parsedAs", { list: values.join(" · "), count: values.length })
      : t("parsedEmpty")}
  </p>
);

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const panels = usePanels(data.steps.map((step) => step.id));

  const setStep = (id: string, changes: Partial<Step>) =>
    patch({
      steps: data.steps.map((step) =>
        step.id === id ? { ...step, ...changes } : step,
      ),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.steps.length) return;
    const steps = [...data.steps];
    [steps[index], steps[to]] = [steps[to], steps[index]];
    patch({ steps });
  };

  /** Pre-filled with the row before it — the learner's own previous step, or
   *  the starting array for the first one — so adding a step starts from the
   *  array as it already stands rather than from nothing. */
  const addStep = () => {
    const previous =
      data.steps.length > 0 ? data.steps[data.steps.length - 1].expected : data.initial;
    const id = newId(data.steps.map((step) => step.id));
    patch({ steps: [...data.steps, { id, label: "", expected: [...previous] }] });
  };

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField
        label={t("modeLabel")}
        hint={t("modeHint")}
        value={data.mode}
        options={[
          { value: "rearrange" as Mode, label: t("modeRearrange") },
          { value: "write" as Mode, label: t("modeWrite") },
        ]}
        onChange={(mode) => patch({ mode })}
      />

      <div className="bitflow-field">
        <ValuesField
          label={t("initialLabel")}
          hint={t("initialHint")}
          placeholder={t("initialPlaceholder")}
          values={data.initial}
          error={errorFor(errors, "initial")}
          onChange={(initial) => patch({ initial })}
        />
        <Parsed values={data.initial} t={t} />
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("stepsLabel")}</legend>
        <span className="bitflow-hint">{t("stepsHint")}</span>
        {errorAt(errors, "steps") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "steps")}
          </span>
        )}
        {data.steps.length === 0 && (
          <p className="bitflow-text-muted">{t("noSteps")}</p>
        )}

        {data.steps.map((step, index) => (
          <div key={step.id} className="bitflow-rule">
            <Disclosure
              {...panels.props(step.id)}
              summary={step.label || t("unnamedStep", { number: index + 1 })}
              aside={t("position", { position: index + 1 })}
            >
              <TextField
                label={t("stepLabelLabel")}
                placeholder={t("stepLabelPlaceholder")}
                value={step.label}
                onChange={(label) => setStep(step.id, { label })}
              />

              <div className="bitflow-field">
                <ValuesField
                  label={t("stepExpectedLabel")}
                  hint={t("stepExpectedHint")}
                  values={step.expected}
                  error={errorFor(errors, `steps.${index}.expected`)}
                  onChange={(expected) => setStep(step.id, { expected })}
                />
                <Parsed values={step.expected} t={t} />
              </div>

              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  {t("moveUp")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === data.steps.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {t("moveDown")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() =>
                    patch({ steps: data.steps.filter((other) => other.id !== step.id) })
                  }
                >
                  {t("remove")}
                </button>
              </div>
            </Disclosure>
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={addStep}
          >
            {t("addStep")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("showIndicesLabel")}
          hint={t("showIndicesHint")}
          checked={data.showIndices}
          onChange={(showIndices) => patch({ showIndices })}
        />
        <CheckboxField
          label={t("caseSensitiveLabel")}
          hint={t("caseSensitiveHint")}
          checked={data.caseSensitive}
          onChange={(caseSensitive) => patch({ caseSensitive })}
        />
        <CheckboxField
          label={t("partialCreditLabel")}
          hint={t("partialCreditHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
        />
        {data.mode === "write" && (
          <Field label={t("slotsLabel")} hint={t("slotsHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={1}
                step={1}
                value={data.slots ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  const slots = Number(raw);
                  patch({
                    slots:
                      raw === "" || !Number.isFinite(slots) || slots < 1
                        ? undefined
                        : Math.round(slots),
                  });
                }}
              />
            )}
          </Field>
        )}
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
