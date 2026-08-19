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
} from "@bitflow/element";
import { useId, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  lengthOf,
  MARKING_MODES,
  type Answer,
  type Criterion,
  type CriterionOutcome,
  type Data,
  type Marking,
} from "./schema";

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
  const id = useId();
  const countId = `${id}-count`;
  const text = answer?.text ?? "";
  const length = lengthOf(text);
  const marks = result?.detail?.criteria as CriterionOutcome[] | undefined;

  const count = data.maximumLength
    ? t("countRemaining", { count: length, maximum: data.maximumLength })
    : data.minimumLength
      ? t("countTowards", { count: length, minimum: data.minimumLength })
      : t("countUnlimited", { count: length });

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />

      {/*
        Said before they write, not after they are marked. A learner who thinks
        a machine is grading their paragraph writes for the machine — and one
        who does not know a person is going to read it writes less than they
        would have.
      */}
      <p className="bitflow-text-muted">
        {data.marking === "person" ? t("goingToReader") : t("goingToKeywords")}
      </p>

      <div className="bitflow-field">
        <label className="bitflow-label" htmlFor={id}>
          {t("answerLabel")}
        </label>
        <textarea
          id={id}
          className="bitflow-textarea"
          rows={8}
          value={text}
          disabled={readonly}
          placeholder={data.placeholder || undefined}
          aria-describedby={countId}
          maxLength={data.maximumLength > 0 ? data.maximumLength : undefined}
          onChange={(event) => onAnswerChange({ text: event.target.value })}
        />
        {/*
          `polite`, so the count is available on demand without interrupting a
          keystroke at a time — a live count read out per character is unusable.
        */}
        <span className="bitflow-hint" id={countId} aria-live="polite">
          {count}
          {data.maximumLength > 0 &&
            text.length >= data.maximumLength &&
            ` ${t("atLimit")}`}
        </span>
      </div>

      {/*
        The rubric before the answer is submitted, and again with outcomes
        after: knowing what is being looked for is part of the question, not a
        reward for finishing it.
      */}
      {data.criteria.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("rubricHeading")}</span>
          <ul className="bitflow-free-text-rubric">
            {data.criteria.map((criterion) => {
              const mark = marks?.find(
                (outcome) => outcome.criterionId === criterion.id,
              );
              const state =
                mark?.met === undefined
                  ? "pending"
                  : mark.met
                    ? "met"
                    : "missed";
              return (
                <li
                  key={criterion.id}
                  className={`bitflow-free-text-criterion bitflow-free-text-criterion-${state}`}
                >
                  <span aria-hidden="true" className="bitflow-free-text-mark">
                    {state === "met" ? "✓" : state === "missed" ? "·" : "?"}
                  </span>
                  <span>
                    {criterion.label}
                    {mark && (
                      <span className="bitflow-visually-hidden">
                        {" "}
                        {t(
                          state === "met"
                            ? "mentioned"
                            : state === "missed"
                              ? "notMentioned"
                              : "awaitingReader",
                        )}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result && data.modelAnswer.trim() !== "" && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("modelHeading")}</span>
          <div className="bitflow-free-text-model">
            <Markdown markdown={data.modelAnswer} />
          </div>
        </div>
      )}
    </div>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `criterion-${n}`;
    if (!taken.includes(id)) return id;
  }
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

  const nameOf = (criterion: Criterion, index: number) =>
    criterion.label || t("unnamedCriterion", { number: index + 1 });

  const setCriterion = (id: string, changes: Partial<Criterion>) =>
    patch({
      criteria: data.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, ...changes } : criterion,
      ),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.criteria.length) return;
    const criteria = [...data.criteria];
    [criteria[index], criteria[to]] = [criteria[to], criteria[index]];
    patch({ criteria });
  };

  const length = (
    which: "minimumLength" | "maximumLength",
    label: string,
    hint: string,
  ) => (
    <Field label={label} hint={hint} error={errorFor(errors, which)}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input"
          min={0}
          step={50}
          value={data[which]}
          onChange={(event) =>
            patch({
              [which]: Math.max(0, Math.round(Number(event.target.value) || 0)),
            })
          }
        />
      )}
    </Field>
  );

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        error={errorFor(errors, "instruction")}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField
        label={t("markingLabel")}
        hint={
          data.marking === "person"
            ? t("markingPersonHint")
            : t("markingKeywordsHint")
        }
        value={data.marking}
        options={MARKING_MODES.map((mode) => ({
          value: mode as Marking,
          label: t(mode === "person" ? "markingPerson" : "markingKeywords"),
        }))}
        onChange={(marking) => patch({ marking })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("criteriaLabel")}</legend>
        <span className="bitflow-hint">{t("criteriaHint")}</span>
        {errorAt(errors, "criteria") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "criteria")}
          </span>
        )}
        {data.criteria.length === 0 && (
          <p className="bitflow-text-muted">{t("noCriteria")}</p>
        )}

        {data.criteria.map((criterion, index) => (
          <div key={criterion.id} className="bitflow-stack-small bitflow-stack">
            <div className="bitflow-free-text-row">
              <input
                type="text"
                className="bitflow-input"
                value={criterion.label}
                placeholder={t("criterionLabelPlaceholder")}
                aria-label={t("criterionLabelOf", { position: index + 1 })}
                onChange={(event) =>
                  setCriterion(criterion.id, { label: event.target.value })
                }
              />
              <input
                type="number"
                className="bitflow-input bitflow-free-text-points"
                min={0}
                step={1}
                value={criterion.points}
                aria-label={t("criterionPointsOf", {
                  label: nameOf(criterion, index),
                })}
                onChange={(event) =>
                  setCriterion(criterion.id, {
                    points: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
              <div className="bitflow-row bitflow-free-text-actions">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveUpOf", { label: nameOf(criterion, index) })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveDownOf", {
                    label: nameOf(criterion, index),
                  })}
                  disabled={index === data.criteria.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeCriterionOf", {
                    label: nameOf(criterion, index),
                  })}
                  onClick={() =>
                    patch({
                      criteria: data.criteria.filter(
                        (other) => other.id !== criterion.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {errorFor(errors, `criteria.${index}.label`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `criteria.${index}.label`)}
              </span>
            )}

            {/* Only where something is going to read them. A rubric a person
                marks by is a sentence, and asking for keywords beside it would
                suggest they were doing something. */}
            {data.marking === "keywords" && (
              <TextAreaField
                label={t("keywordsLabel")}
                hint={t("keywordsHint")}
                rows={2}
                value={criterion.keywords.join("\n")}
                error={errorFor(errors, `criteria.${index}.keywords`)}
                onChange={(value) =>
                  setCriterion(criterion.id, { keywords: value.split("\n") })
                }
              />
            )}
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                criteria: [
                  ...data.criteria,
                  {
                    id: newId(data.criteria.map((criterion) => criterion.id)),
                    label: "",
                    keywords: [],
                    points: 1,
                  },
                ],
              })
            }
          >
            {t("addCriterion")}
          </button>
        </div>
      </fieldset>

      <TextAreaField
        label={t("modelLabel")}
        hint={t("modelHint")}
        rows={4}
        value={data.modelAnswer}
        onChange={(modelAnswer) => patch({ modelAnswer })}
      />

      <Disclosure summary={t("advanced")}>
        <TextField
          label={t("placeholderLabel")}
          hint={t("placeholderHint")}
          value={data.placeholder}
          onChange={(placeholder) => patch({ placeholder })}
        />

        <fieldset className="bitflow-field">
          <legend className="bitflow-label">{t("lengthLabel")}</legend>
          <span className="bitflow-hint">{t("lengthHint")}</span>
          <div className="bitflow-row">
            {length("minimumLength", t("minimumLabel"), t("minimumFieldHint"))}
            {length("maximumLength", t("maximumLabel"), t("maximumFieldHint"))}
          </div>
        </fieldset>

        {data.marking === "keywords" && (
          <CheckboxField
            label={t("caseSensitiveLabel")}
            hint={t("caseSensitiveHint")}
            checked={data.caseSensitive}
            onChange={(caseSensitive) => patch({ caseSensitive })}
          />
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
