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
import type { BlankOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import { MathAnswer } from "./MathAnswer";
import {
  answerNamesIn,
  blankNamesIn,
  SINGLE_BLANK,
  type Answer,
  type CompareMode,
  type Data,
} from "./schema";

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
    <MathAnswer
      data={data}
      answer={{ prompts: answer?.prompts ?? {} }}
      outcomes={result?.detail?.blanks as BlankOutcome[] | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

/** Feedback rules as the author edits them: `blank: answer: what to say`. */
const feedbackToLines = (entries: Data["blankFeedback"]): string =>
  entries
    .map((entry) => `${entry.blank}: ${entry.latex}: ${entry.feedback.message}`)
    .join("\n");

const linesToFeedback = (text: string): Data["blankFeedback"] =>
  text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [blank, latex, ...rest] = line.split(":");
      return {
        blank: (blank ?? SINGLE_BLANK).trim() || SINGLE_BLANK,
        latex: (latex ?? "").trim(),
        feedback: {
          // The message keeps any colons it contains; only the first two split.
          message: rest.join(":").trim(),
          severity: "info" as const,
        },
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

  const blanks = blankNamesIn(data.latex);
  const names = answerNamesIn(data.latex);

  /** Sets one blank's expected answer, leaving the others alone. */
  const setBlank = (name: string, changes: Partial<Data["blanks"][string]>) => {
    const current = data.blanks[name] ?? { expected: "", accepted: [] };
    patch({ blanks: { ...data.blanks, [name]: { ...current, ...changes } } });
  };

  /**
   * Appends a `\placeholder` with a name nothing is using yet.
   *
   * Typing `\placeholder[b2]{}` by hand is the sort of thing that is fine
   * until the third one, and a duplicate name silently merges two gaps into
   * one answer.
   */
  const addBlank = () => {
    let index = blanks.length + 1;
    while (blanks.includes(`b${index}`)) index += 1;
    patch({ latex: `${data.latex}\\placeholder[b${index}]{}` });
  };

  const compareOptions: Array<{ value: CompareMode; label: string }> = [
    { value: "symbolic", label: t("compareSymbolic") },
    { value: "equivalent", label: t("compareEquivalent") },
    { value: "value", label: t("compareValue") },
  ];

  const compareHint =
    data.compare === "symbolic"
      ? t("compareSymbolicHint")
      : data.compare === "equivalent"
        ? t("compareEquivalentHint")
        : t("compareValueHint");

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
        label={t("latexLabel")}
        hint={t("latexHint")}
        rows={3}
        value={data.latex}
        error={errorFor(errors, "latex")}
        onChange={(latex) => patch({ latex })}
      />

      <div className="bitflow-row">
        <button type="button" className="bitflow-button bitflow-button-secondary" onClick={addBlank}>
          {t("addBlank")}
        </button>
        <span className="bitflow-hint">
          {blanks.length === 0
            ? t("noBlanks")
            : t("blanksFound", { count: blanks.length, names: blanks.join(", ") })}
        </span>
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">
          {blanks.length > 0 ? t("blanksHeading") : t("singleHeading")}
        </legend>
        {names.map((name) => (
          <div className="bitflow-stack-small" key={name}>
            <TextField
              label={
                name === SINGLE_BLANK
                  ? t("expectedLabel")
                  : t("expectedFor", { name })
              }
              value={data.blanks[name]?.expected ?? ""}
              error={errorFor(errors, `blanks.${name}`)}
              onChange={(expected) => setBlank(name, { expected })}
            />
            <TextAreaField
              label={t("acceptedLabel")}
              hint={t("acceptedHint")}
              rows={2}
              value={(data.blanks[name]?.accepted ?? []).join("\n")}
              onChange={(value) =>
                setBlank(name, {
                  accepted: value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line !== ""),
                })
              }
            />
          </div>
        ))}
      </fieldset>

      <SelectField
        label={t("compareLabel")}
        hint={compareHint}
        value={data.compare}
        options={compareOptions}
        // Switching away from a value comparison takes the tolerance with it,
        // rather than leaving a number behind that nothing reads.
        onChange={(compare) =>
          patch({ compare, tolerance: compare === "value" ? data.tolerance : 0 })
        }
      />

      {data.compare === "value" && (
        <Field label={t("toleranceLabel")} error={errorFor(errors, "tolerance")}>
          {(props) => (
            <input
              {...props}
              type="number"
              className="bitflow-input"
              min={0}
              step={0.001}
              value={data.tolerance}
              onChange={(event) =>
                patch({ tolerance: Math.max(0, Number(event.target.value) || 0) })
              }
            />
          )}
        </Field>
      )}

      {/*
        The learner's own field, wired to nothing. It is the only way to see
        that the blanks landed where they were meant to — a `\placeholder` in
        the wrong pair of braces is invisible in the source and obvious here.
        Keyed on the formula so a changed template rebuilds it: a mathfield is
        uncontrolled and will not pick the change up on its own.
      */}
      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <MathAnswer
          key={data.latex}
          data={data}
          answer={{ prompts: {} }}
          locale={locale}
          readonly
          onChange={() => undefined}
        />
      </div>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("partialLabel")}
          hint={t("partialHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
        />
        <CheckboxField
          label={t("keyboardLabel")}
          hint={t("keyboardHint")}
          checked={data.virtualKeyboard}
          onChange={(virtualKeyboard) => patch({ virtualKeyboard })}
        />
        <TextAreaField
          label={t("feedbackLabel")}
          hint={t("feedbackHint")}
          rows={3}
          value={feedbackToLines(data.blankFeedback)}
          error={errorFor(errors, "blankFeedback")}
          onChange={(value) => patch({ blankFeedback: linesToFeedback(value) })}
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
