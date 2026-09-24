import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { tableFromPaste } from "./paste";
import {
  blankRow,
  COLUMN_KINDS,
  emptyBlankCell,
  newId,
  type Answer,
  type Column,
  type ColumnKind,
  type Data,
  type Row,
  type RowOrder,
} from "./schema";
import { columnHeading, FillableTable, rowHeading, TableEditor } from "./Table";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const states = (result?.detail as { cells?: CellStates } | undefined)?.cells;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-hint">
        {readonly
          ? t("howToReadonly")
          : t(data.rowOrder === "any" ? "howToAnyOrder" : "howTo")}
      </p>
      <FillableTable
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

/** One place up or down a list, or nothing if it is already at that end. */
const moved = <T,>(list: T[], index: number, delta: number): T[] | undefined => {
  const to = index + delta;
  if (to < 0 || to >= list.length) return undefined;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const tLearner = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const [pasted, setPasted] = useState("");
  const [pasteError, setPasteError] = useState<string | undefined>(undefined);

  const paste = (as: "given" | "blank") => {
    const table = tableFromPaste(pasted, as);
    if (!table) {
      setPasteError(t("pasteEmpty"));
      return;
    }
    setPasteError(undefined);
    patch(table);
  };

  const setColumn = (id: string, changes: Partial<Column>) =>
    patch({
      columns: data.columns.map((column) =>
        column.id === id ? { ...column, ...changes } : column,
      ),
    });

  /** A new column gets a blank cell in every row, so no row is ever missing one. */
  const addColumn = () => {
    const id = newId("column", data.columns.map((column) => column.id));
    patch({
      columns: [...data.columns, { id, header: "", kind: "text" }],
      rows: data.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [id]: emptyBlankCell() },
      })),
    });
  };

  /** Removing a column takes its cells with it, rather than leaving them to
   *  reappear under a later column that happens to be given the same id. */
  const removeColumn = (id: string) =>
    patch({
      columns: data.columns.filter((column) => column.id !== id),
      rows: data.rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[id];
        return { ...row, cells };
      }),
    });

  const setRow = (id: string, changes: Partial<Row>) =>
    patch({
      rows: data.rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    });

  const kindLabel: Record<ColumnKind, string> = {
    text: t("kindText"),
    number: t("kindNumber"),
    formula: t("kindFormula"),
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

      <TextField
        label={t("captionLabel")}
        hint={t("captionHint")}
        value={data.caption}
        onChange={(caption) => patch({ caption })}
      />

      <Disclosure summary={t("pasteSummary")}>
        <div className="bitflow-stack-small bitflow-stack">
          <TextAreaField
            label={t("pasteLabel")}
            hint={t("pasteHint")}
            rows={5}
            value={pasted}
            error={pasteError}
            onChange={setPasted}
          />
          <div className="bitflow-row">
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={() => paste("blank")}
            >
              {t("pasteAsBlank")}
            </button>
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={() => paste("given")}
            >
              {t("pasteAsGiven")}
            </button>
          </div>
        </div>
      </Disclosure>

      {/* A column is a heading and a kind: one compact line each, like the
          columns of a code trace. */}
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
          const name = columnHeading(column, index, tLearner);
          return (
            <div key={column.id} className="bitflow-table-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={column.header}
                placeholder={t("columnHeaderPlaceholder")}
                aria-label={t("columnHeaderOf", { position: index + 1 })}
                onChange={(event) => setColumn(column.id, { header: event.target.value })}
              />
              <select
                className="bitflow-select"
                value={column.kind}
                aria-label={t("columnKindOf", { position: index + 1 })}
                onChange={(event) =>
                  setColumn(column.id, { kind: event.target.value as ColumnKind })
                }
              >
                {COLUMN_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabel[kind]}
                  </option>
                ))}
              </select>
              <div className="bitflow-row bitflow-table-actions">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveUpOf", { name })}
                  disabled={index === 0}
                  onClick={() => {
                    const columns = moved(data.columns, index, -1);
                    if (columns) patch({ columns });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveDownOf", { name })}
                  disabled={index === data.columns.length - 1}
                  onClick={() => {
                    const columns = moved(data.columns, index, 1);
                    if (columns) patch({ columns });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeOf", { name })}
                  onClick={() => removeColumn(column.id)}
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
            onClick={addColumn}
          >
            {t("addColumn")}
          </button>
        </div>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("rowsLabel")}</legend>
        <span className="bitflow-hint">{t("rowsHint")}</span>
        {errorAt(errors, "rows") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "rows")}
          </span>
        )}
        {data.rows.length === 0 && <p className="bitflow-text-muted">{t("noRows")}</p>}
        {data.rows.map((row, index) => {
          const name = rowHeading(row, index, tLearner);
          return (
            <div key={row.id} className="bitflow-table-editor-row">
              {data.rowHeaders ? (
                <input
                  type="text"
                  className="bitflow-input"
                  value={row.header ?? ""}
                  placeholder={t("rowHeaderPlaceholder")}
                  aria-label={t("rowHeaderOf", { position: index + 1 })}
                  onChange={(event) => setRow(row.id, { header: event.target.value })}
                />
              ) : (
                <span className="bitflow-table-row-name">{name}</span>
              )}
              <div className="bitflow-row bitflow-table-actions">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveUpOf", { name })}
                  disabled={index === 0}
                  onClick={() => {
                    const rows = moved(data.rows, index, -1);
                    if (rows) patch({ rows });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveDownOf", { name })}
                  disabled={index === data.rows.length - 1}
                  onClick={() => {
                    const rows = moved(data.rows, index, 1);
                    if (rows) patch({ rows });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeOf", { name })}
                  onClick={() => patch({ rows: data.rows.filter((r) => r.id !== row.id) })}
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
            onClick={() =>
              patch({
                rows: [
                  ...data.rows,
                  blankRow(data.columns, newId("row", data.rows.map((row) => row.id))),
                ],
              })
            }
          >
            {t("addRow")}
          </button>
        </div>
      </fieldset>

      {data.columns.length > 0 && data.rows.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-hint">{t("answerKeyHint")}</span>
          {/* The per-cell problems are reported against paths deep inside
              `rows`, where no field of their own sits — so they are gathered
              here, above the grid they are about. */}
          {cellErrors(errors).map((message) => (
            <span key={message} className="bitflow-field-error" role="alert">
              {message}
            </span>
          ))}
          <TableEditor data={data} locale={locale} onChange={(rows) => patch({ rows })} />
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("rowHeadersLabel")}
          hint={t("rowHeadersHint")}
          checked={data.rowHeaders}
          onChange={(rowHeaders) => patch({ rowHeaders })}
        />
        <SelectField<RowOrder>
          label={t("rowOrderLabel")}
          hint={t("rowOrderHint")}
          value={data.rowOrder}
          options={[
            { value: "fixed", label: t("rowOrderFixed") },
            { value: "any", label: t("rowOrderAny") },
          ]}
          onChange={(rowOrder) => patch({ rowOrder })}
        />
        <CheckboxField
          label={t("caseSensitiveLabel")}
          hint={t("caseSensitiveHint")}
          checked={data.caseSensitive}
          onChange={(caseSensitive) => patch({ caseSensitive })}
        />
        <CheckboxField
          label={t("ignoreWhitespaceLabel")}
          hint={t("ignoreWhitespaceHint")}
          checked={data.ignoreWhitespace}
          onChange={(ignoreWhitespace) => patch({ ignoreWhitespace })}
        />
        <Field label={t("numberToleranceLabel")} hint={t("numberToleranceHint")}>
          {(props) => (
            <input
              {...props}
              type="number"
              className="bitflow-input bitflow-table-tolerance"
              min={0}
              step="any"
              value={data.numberTolerance}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 0) {
                  patch({ numberTolerance: value });
                }
              }}
            />
          )}
        </Field>
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

/** The problems reported against single cells, deduplicated. */
const cellErrors = (errors: BitFormProps<Data>["errors"]): string[] => [
  ...new Set(
    (errors ?? [])
      .filter((diagnostic) => /^rows\.\d+\.cells\./.test(diagnostic.path))
      .map((diagnostic) => diagnostic.message),
  ),
];
