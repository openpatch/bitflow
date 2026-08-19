import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { format, parse } from "./expression";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { rowsOf, type Answer, type Column, type Data } from "./schema";
import { TruthTable } from "./TruthTable";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-text-muted">
        {readonly ? t("howToReadonly") : t("howTo")}
      </p>
      <TruthTable
        data={data}
        answer={answer}
        states={result?.detail?.cells as CellStates | undefined}
        readonly={readonly}
        locale={locale}
        onChange={onAnswerChange}
      />
    </div>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `column-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** The answer that fills a table in, for the authoring preview. */
const worked = (data: Data): Answer => ({
  cells: Object.fromEntries(
    rowsOf(data).map((row) => [
      row.id,
      Object.fromEntries(data.columns.map((column) => [column.id, null])),
    ]),
  ),
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

  /**
   * The expressions as text, one per column.
   *
   * The document holds trees, and `format` writes a tree back out its own way —
   * `A AND B` becomes `A ∧ B`. Rebuilding the box from the document on every
   * render would rewrite what the author is typing under the caret, so the text
   * is held here and the tree is what gets stored.
   */
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.columns.map((column) => [column.id, format(column.expression)]),
    ),
  );

  /** Re-seeded when a column arrives saying something the box does not. */
  useEffect(() => {
    setText((current) => {
      const next = { ...current };
      let changed = false;
      for (const column of data.columns) {
        const parsed = parse(next[column.id] ?? "");
        const shown = parsed.ok ? format(parsed.value) : undefined;
        if (shown === format(column.expression)) continue;
        next[column.id] = format(column.expression);
        changed = true;
      }
      return changed ? next : current;
    });
  }, [data.columns]);

  const nameOf = (column: Column, index: number) =>
    column.label ||
    format(column.expression) ||
    t("unnamedColumn", { number: index + 1 });

  const setColumn = (id: string, changes: Partial<Column>) =>
    patch({
      columns: data.columns.map((column) =>
        column.id === id ? { ...column, ...changes } : column,
      ),
    });

  const write = (id: string, source: string) => {
    setText((current) => ({ ...current, [id]: source }));
    const parsed = parse(source);
    // An expression halfway through being typed is not a document to store.
    // The last one that parsed stays until this one does, and the message
    // below the box says why nothing is moving.
    if (parsed.ok) setColumn(id, { expression: parsed.value });
  };

  const moveColumn = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.columns.length) return;
    const columns = [...data.columns];
    [columns[index], columns[to]] = [columns[to], columns[index]];
    patch({ columns });
  };

  const rows = rowsOf(data);

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
        label={t("variablesLabel")}
        hint={t("variablesHint")}
        rows={3}
        placeholder={t("variablesPlaceholder")}
        value={data.variables.join("\n")}
        error={errorFor(errors, "variables")}
        onChange={(value) =>
          patch({
            variables: value
              .split("\n")
              .map((name) => name.trim())
              .filter(Boolean),
          })
        }
      />
      {data.variables.length > 0 && (
        <p className="bitflow-hint">{t("rowCount", { count: rows.length })}</p>
      )}

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("columnsLabel")}</legend>
        <span className="bitflow-hint">{t("columnsHint")}</span>
        {errorAt(errors, "columns") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "columns")}
          </span>
        )}
        {data.columns.length === 0 && (
          <p className="bitflow-text-muted">{t("noColumns")}</p>
        )}

        {data.columns.map((column, index) => {
          const source = text[column.id] ?? format(column.expression);
          const parsed = parse(source);
          return (
            <div key={column.id} className="bitflow-stack-small bitflow-stack">
              <div className="bitflow-truth-editor-row">
                <input
                  type="text"
                  className="bitflow-input bitflow-truth-expression"
                  value={source}
                  placeholder={t("expressionPlaceholder")}
                  aria-label={t("expressionOf", { position: index + 1 })}
                  aria-invalid={parsed.ok ? undefined : true}
                  onChange={(event) => write(column.id, event.target.value)}
                />
                <input
                  type="text"
                  className="bitflow-input"
                  value={column.label}
                  placeholder={t("labelPlaceholder")}
                  aria-label={t("labelOf", { column: nameOf(column, index) })}
                  onChange={(event) =>
                    setColumn(column.id, { label: event.target.value })
                  }
                />
                <div className="bitflow-row bitflow-truth-actions">
                  <button
                    type="button"
                    className="bitflow-button bitflow-button-quiet"
                    aria-label={t("moveLeftOf", { column: nameOf(column, index) })}
                    disabled={index === 0}
                    onClick={() => moveColumn(index, -1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="bitflow-button bitflow-button-quiet"
                    aria-label={t("moveRightOf", { column: nameOf(column, index) })}
                    disabled={index === data.columns.length - 1}
                    onClick={() => moveColumn(index, 1)}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="bitflow-button bitflow-button-quiet"
                    aria-label={t("removeColumnOf", {
                      column: nameOf(column, index),
                    })}
                    onClick={() =>
                      patch({
                        columns: data.columns.filter(
                          (other) => other.id !== column.id,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* What the expression was understood to be, or what stopped it
                  being understood. Precedence is where these go wrong, and
                  reading the brackets back is the only way to see it. */}
              {parsed.ok ? (
                <p className="bitflow-hint">
                  {t("readAsLabel")}: <code>{format(parsed.value)}</code>
                </p>
              ) : (
                <span className="bitflow-field-error" role="alert">
                  {parsed.error}
                </span>
              )}
              {errorFor(errors, `columns.${index}.expression`) && (
                <span className="bitflow-field-error" role="alert">
                  {errorFor(errors, `columns.${index}.expression`)}
                </span>
              )}

              <CheckboxField
                label={t("givenOf", { column: nameOf(column, index) })}
                hint={t("givenHint")}
                checked={column.given}
                onChange={(given) => setColumn(column.id, { given })}
              />
            </div>
          );
        })}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                columns: [
                  ...data.columns,
                  {
                    id: newId(data.columns.map((column) => column.id)),
                    label: "",
                    expression: {
                      kind: "variable" as const,
                      name: data.variables[0] ?? "A",
                    },
                    given: false,
                  },
                ],
              })
            }
          >
            {t("addColumn")}
          </button>
        </div>
      </fieldset>

      {/* The finished table, worked out the way the answer will be. There is
          no answer key to show — the expression is the answer key — so this is
          the only place an author can check they wrote what they meant. */}
      {rows.length > 0 && data.columns.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-hint">{t("previewHint")}</span>
          <TruthTable
            data={{
              ...data,
              // Every column shown worked out: in the preview the author is
              // reading the table, not answering it.
              columns: data.columns.map((column) => ({ ...column, given: true })),
            }}
            answer={worked(data)}
            readonly
            locale={locale}
            caption={t("previewLabel")}
            onChange={() => {}}
          />
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        <SelectField
          label={t("rowOrderLabel")}
          value={data.rowOrder}
          options={[
            { value: "standard" as const, label: t("rowOrderStandard") },
            { value: "reversed" as const, label: t("rowOrderReversed") },
          ]}
          onChange={(rowOrder) => patch({ rowOrder })}
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
