import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
  usePanels,
} from "@bitflow/element";
import { useId, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { isFilledIn, newField, type Answer, type Data } from "./schema";

/**
 * Who the learner is, asked once, before anything is graded.
 *
 * Ordinary form controls with real labels rather than anything clever: this is
 * the first thing anyone meets, and it is the screen where a learner using a
 * screen reader or a phone keyboard decides whether the rest is going to work.
 */
export const Task = ({
  data,
  answer,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const group = useId();
  // A field with no wording is not a question, so it is not shown and not
  // required — see `isFilledIn`.
  const fields = data.fields.filter((field) => field.label.trim() !== "");
  const set = (id: string, value: string) =>
    onAnswerChange({ ...answer, [id]: value });

  return (
    <div className="bitflow-stack">
      {data.title && <h1 className="bitflow-heading">{data.title}</h1>}
      <Markdown markdown={data.markdown} />

      {fields.length > 0 && (
        <fieldset className="bitflow-identify">
          <legend className="bitflow-label">{t("legend")}</legend>

          {fields.map((field) => {
            const id = `${group}-${field.id}`;
            const label = field.required
              ? `${field.label} (${t("required")})`
              : field.label;

            return (
              <div key={field.id} className="bitflow-field">
                <label className="bitflow-label" htmlFor={id}>
                  {label}
                </label>
                {field.hint && (
                  <span className="bitflow-hint">{field.hint}</span>
                )}
                {field.kind === "select" ? (
                  <select
                    id={id}
                    className="bitflow-select"
                    value={answer?.[field.id] ?? ""}
                    disabled={readonly}
                    required={field.required}
                    onChange={(event) => set(field.id, event.target.value)}
                  >
                    <option value="">{t("choose")}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type="text"
                    className="bitflow-input"
                    value={answer?.[field.id] ?? ""}
                    disabled={readonly}
                    required={field.required}
                    onChange={(event) => set(field.id, event.target.value)}
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      )}

      {/* Why Next will not move: above the button and before it in reading
          order, so the reason arrives before the dead control — and always
          rendered, so filling in the last field does not shift the button up
          by a line just as they reach for it. */}
      <p className="bitflow-identify-required">
        {!isFilledIn(data, answer) && !readonly && t("incomplete")}
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
  const panels = usePanels(data.fields.map((field) => field.id));

  const update = (id: string, patch: Partial<Data["fields"][number]>) =>
    onChange({
      ...data,
      fields: data.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    });

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
        rows={4}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />

      <h4 className="bitflow-label">{t("fieldsLabel")}</h4>
      <p className="bitflow-hint">{t("fieldsHint")}</p>

      {data.fields.map((field) => (
        <Disclosure
          key={field.id}
          summary={field.label || t("fieldUnnamed")}
          {...panels.props(field.id)}
        >
          <TextField
            label={t("fieldLabel")}
            hint={t("fieldLabelHint")}
            value={field.label}
            onChange={(label) => update(field.id, { label })}
          />
          <TextField
            label={t("fieldHint")}
            value={field.hint}
            onChange={(hint) => update(field.id, { hint })}
          />
          <SelectField
            label={t("fieldKind")}
            value={field.kind}
            options={[
              { value: "text", label: t("fieldKindText") },
              { value: "select", label: t("fieldKindSelect") },
            ]}
            onChange={(kind) => update(field.id, { kind })}
          />
          {field.kind === "select" && (
            // A list of short strings gets a textarea, not a panel per line.
            <TextAreaField
              label={t("fieldOptions")}
              hint={t("fieldOptionsHint")}
              rows={4}
              value={field.options.join("\n")}
              onChange={(text) =>
                update(field.id, {
                  options: text
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line !== ""),
                })
              }
            />
          )}
          <CheckboxField
            label={t("fieldRequired")}
            checked={field.required}
            onChange={(required) => update(field.id, { required })}
          />
          <button
            type="button"
            className="bitflow-button bitflow-button-quiet"
            onClick={() =>
              onChange({
                ...data,
                fields: data.fields.filter((other) => other.id !== field.id),
              })
            }
          >
            {t("removeField")}
          </button>
        </Disclosure>
      ))}

      <button
        type="button"
        className="bitflow-button bitflow-button-secondary"
        onClick={() => onChange({ ...data, fields: [...data.fields, newField()] })}
      >
        {t("addField")}
      </button>
    </div>
  );
};
