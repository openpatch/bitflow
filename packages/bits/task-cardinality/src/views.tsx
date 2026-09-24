import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  EvaluationFields,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { Diagram } from "./Diagram";
import type { EndStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  labelsOf,
  type Answer,
  type Data,
  type Entity,
  type Notation,
  type Relationship,
} from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const states = (result?.detail as { ends?: EndStates } | undefined)?.ends;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>
      <Diagram
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

/** A fresh id that will not collide with one already in use. */
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** Per cent across or down, as the fraction the diagram stores. */
const percentInput = (
  value: number,
  label: string,
  onChange: (fraction: number) => void,
): ReactElement => (
  <input
    type="number"
    min={0}
    max={100}
    step={1}
    className="bitflow-input bitflow-cardinality-percent"
    aria-label={label}
    value={Math.round(value * 100)}
    onChange={(event) => {
      const percent = Number(event.target.value);
      if (event.target.value !== "" && percent >= 0 && percent <= 100) onChange(percent / 100);
    }}
  />
);

export const Form = ({ data, locale, onChange, errors }: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const labels = labelsOf(data.notation);

  const setEntity = (id: string, changes: Partial<Entity>) =>
    patch({ entities: data.entities.map((entity) => (entity.id === id ? { ...entity, ...changes } : entity)) });

  const setRelationship = (id: string, changes: Partial<Relationship>) =>
    patch({
      relationships: data.relationships.map((relationship) =>
        relationship.id === id ? { ...relationship, ...changes } : relationship,
      ),
    });

  /** A new entity goes where there is likely room: along a row, wrapping. */
  const addEntity = () => {
    const index = data.entities.length;
    patch({
      entities: [
        ...data.entities,
        {
          id: newId("entity", data.entities.map((entity) => entity.id)),
          name: "",
          x: [0.2, 0.8, 0.5][index % 3],
          y: [0.25, 0.25, 0.75][index % 3],
        },
      ],
    });
  };

  /** Removing an entity takes its relationships with it: a line to nothing
   *  cannot be drawn or answered. */
  const removeEntity = (id: string) =>
    patch({
      entities: data.entities.filter((entity) => entity.id !== id),
      relationships: data.relationships.filter(
        (relationship) => relationship.from !== id && relationship.to !== id,
      ),
    });

  /** A different notation offers different labels, so answers written in the
   *  old one are cleared rather than left pointing at labels that are gone. */
  const setNotation = (notation: Notation) =>
    patch({
      notation,
      relationships: data.relationships.map((relationship) => ({
        ...relationship,
        expectedFrom: labelsOf(notation).includes(relationship.expectedFrom) ? relationship.expectedFrom : "",
        expectedTo: labelsOf(notation).includes(relationship.expectedTo) ? relationship.expectedTo : "",
      })),
    });

  const relationshipErrors = [
    ...new Set(
      (errors ?? [])
        .filter((diagnostic) => /^relationships\.\d+\./.test(diagnostic.path))
        .map((diagnostic) => diagnostic.message),
    ),
  ];

  const entitySelect = (value: string, label: string, set: (id: string) => void) => (
    <select className="bitflow-select" aria-label={label} value={value} onChange={(event) => set(event.target.value)}>
      <option value="">{t("chooseEntity")}</option>
      {data.entities.map((entity, index) => (
        <option key={entity.id} value={entity.id}>
          {entity.name || `${index + 1}`}
        </option>
      ))}
    </select>
  );

  const labelSelect = (value: string, label: string, set: (value: string) => void) => (
    <select className="bitflow-select" aria-label={label} value={value} onChange={(event) => set(event.target.value)}>
      <option value="">{t("chooseLabel")}</option>
      {labels.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField<Notation>
        label={t("notationLabel")}
        hint={t("notationHint")}
        value={data.notation}
        options={[
          { value: "chen", label: t("notationChen") },
          { value: "minmax", label: t("notationMinmax") },
          { value: "uml", label: t("notationUml") },
        ]}
        onChange={setNotation}
      />

      {/* An entity is a name and a place: one compact line each. */}
      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("entitiesLabel")}</legend>
        <span className="bitflow-hint">{t("entitiesHint")}</span>
        {errorAt(errors, "entities") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "entities")}
          </span>
        )}
        {data.entities.length === 0 && <p className="bitflow-text-muted">{t("noEntities")}</p>}
        {data.entities.map((entity, index) => {
          const position = index + 1;
          return (
            <div key={entity.id} className="bitflow-cardinality-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={entity.name}
                placeholder={t("entityNamePlaceholder")}
                aria-label={t("entityNameOf", { position })}
                onChange={(event) => setEntity(entity.id, { name: event.target.value })}
              />
              {percentInput(entity.x, t("entityXOf", { position }), (x) => setEntity(entity.id, { x }))}
              {percentInput(entity.y, t("entityYOf", { position }), (y) => setEntity(entity.id, { y }))}
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removeEntityOf", { position })}
                onClick={() => removeEntity(entity.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
        <div className="bitflow-row">
          <button type="button" className="bitflow-button bitflow-button-secondary" onClick={addEntity}>
            {t("addEntity")}
          </button>
        </div>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("relationshipsLabel")}</legend>
        <span className="bitflow-hint">{t("relationshipsHint")}</span>
        {errorAt(errors, "relationships") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "relationships")}
          </span>
        )}
        {relationshipErrors.map((message) => (
          <span key={message} className="bitflow-field-error" role="alert">
            {message}
          </span>
        ))}
        {data.relationships.length === 0 && <p className="bitflow-text-muted">{t("noRelationships")}</p>}
        {data.relationships.map((relationship, index) => {
          const position = index + 1;
          const set = (changes: Partial<Relationship>) => setRelationship(relationship.id, changes);
          return (
            <div key={relationship.id} className="bitflow-rule">
              <div className="bitflow-cardinality-editor-row">
                {entitySelect(relationship.from, t("relationshipFromOf", { position }), (from) => set({ from }))}
                <input
                  type="text"
                  className="bitflow-input"
                  value={relationship.name}
                  placeholder={t("relationshipNamePlaceholder")}
                  aria-label={t("relationshipNameOf", { position })}
                  onChange={(event) => set({ name: event.target.value })}
                />
                {entitySelect(relationship.to, t("relationshipToOf", { position }), (to) => set({ to }))}
              </div>
              <div className="bitflow-cardinality-editor-row">
                {labelSelect(relationship.expectedFrom, t("expectedFromOf", { position }), (expectedFrom) =>
                  set({ expectedFrom }),
                )}
                {labelSelect(relationship.expectedTo, t("expectedToOf", { position }), (expectedTo) =>
                  set({ expectedTo }),
                )}
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeRelationshipOf", { position })}
                  onClick={() =>
                    patch({ relationships: data.relationships.filter((other) => other.id !== relationship.id) })
                  }
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            disabled={data.entities.length < 2}
            onClick={() =>
              patch({
                relationships: [
                  ...data.relationships,
                  {
                    id: newId("relationship", data.relationships.map((relationship) => relationship.id)),
                    name: "",
                    from: data.entities[0]?.id ?? "",
                    to: data.entities[1]?.id ?? "",
                    expectedFrom: "",
                    expectedTo: "",
                  },
                ],
              })
            }
          >
            {t("addRelationship")}
          </button>
        </div>
      </fieldset>

      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <Diagram data={data} locale={locale} showAnswers />
      </div>

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
