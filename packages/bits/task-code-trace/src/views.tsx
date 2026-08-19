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
import type { CellStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  linesOf,
  type Answer,
  type Checkpoint,
  type Column,
  type ColumnKind,
  type Data,
} from "./schema";
import { CodeListing, TraceTable } from "./Trace";

/**
 * Line numbers are not optional once a column asks which line runs next: the
 * answer names a line, so the learner has to be able to see which is which.
 */
const numbersNeeded = (data: Data): boolean =>
  data.showLineNumbers || data.columns.some((column) => column.kind === "line");

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
      <CodeListing data={data} locale={locale} showNumbers={numbersNeeded(data)} />
      <TraceTable
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
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
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

  const lines = linesOf(data.code);

  const setColumn = (id: string, changes: Partial<Column>) =>
    patch({
      columns: data.columns.map((column) =>
        column.id === id ? { ...column, ...changes } : column,
      ),
    });

  const setCheckpoint = (id: string, changes: Partial<Checkpoint>) =>
    patch({
      checkpoints: data.checkpoints.map((checkpoint) =>
        checkpoint.id === id ? { ...checkpoint, ...changes } : checkpoint,
      ),
    });

  const setExpected = (checkpoint: Checkpoint, columnId: string, value: string) =>
    setCheckpoint(checkpoint.id, {
      expected: { ...checkpoint.expected, [columnId]: value },
    });

  const moveCheckpoint = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.checkpoints.length) return;
    const checkpoints = [...data.checkpoints];
    [checkpoints[index], checkpoints[to]] = [checkpoints[to], checkpoints[index]];
    patch({ checkpoints });
  };

  /**
   * Removing a column takes its expected values with it. Left behind they
   * would be invisible in the form and would come back if a new column
   * happened to be given the same id.
   */
  const removeColumn = (id: string) =>
    patch({
      columns: data.columns.filter((column) => column.id !== id),
      checkpoints: data.checkpoints.map((checkpoint) => {
        const expected = { ...checkpoint.expected };
        delete expected[id];
        return { ...checkpoint, expected };
      }),
    });

  const columnHeading = (column: Column, index: number) =>
    column.name || `${t("unnamedColumn")} ${index + 1}`;

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
        label={t("languageLabel")}
        hint={t("languageHint")}
        value={data.language}
        onChange={(language) => patch({ language })}
      />

      <TextAreaField
        label={t("codeLabel")}
        hint={t("codeHint")}
        rows={8}
        value={data.code}
        error={errorFor(errors, "code")}
        onChange={(code) => patch({ code })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("columnsLabel")}</legend>
        <span className="bitflow-hint">{t("columnsHint")}</span>
        {errorFor(errors, "columns") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "columns")}
          </span>
        )}
        {data.columns.length === 0 && (
          <p className="bitflow-text-muted">{t("noColumns")}</p>
        )}

        {data.columns.map((column, index) => (
          <Disclosure
            key={column.id}
            summary={columnHeading(column, index)}
            aside={t("position", { position: index + 1, total: data.columns.length })}
          >
            <TextField
              label={t("columnName")}
              hint={t("columnNameHint")}
              value={column.name}
              error={errorFor(errors, `columns.${index}.name`)}
              onChange={(name) => setColumn(column.id, { name })}
            />
            <SelectField
              label={t("columnKind")}
              value={column.kind}
              options={[
                { value: "value" as ColumnKind, label: t("kindValue") },
                { value: "output" as ColumnKind, label: t("kindOutput") },
                { value: "line" as ColumnKind, label: t("kindLine") },
              ]}
              onChange={(kind) => setColumn(column.id, { kind })}
            />
            <div className="bitflow-row">
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() => removeColumn(column.id)}
              >
                {t("remove")}
              </button>
            </div>
          </Disclosure>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                columns: [
                  ...data.columns,
                  {
                    id: newId("column", data.columns.map((column) => column.id)),
                    name: "",
                    kind: "value" as ColumnKind,
                  },
                ],
              })
            }
          >
            {t("addColumn")}
          </button>
        </div>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("checkpointsLabel")}</legend>
        <span className="bitflow-hint">{t("checkpointsHint")}</span>
        {errorFor(errors, "checkpoints") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "checkpoints")}
          </span>
        )}
        {data.checkpoints.length === 0 && (
          <p className="bitflow-text-muted">{t("noCheckpoints")}</p>
        )}

        {data.checkpoints.map((checkpoint, index) => (
          <Disclosure
            key={checkpoint.id}
            summary={
              checkpoint.label || t("unnamedCheckpoint", { number: index + 1 })
            }
            aside={t("position", {
              position: index + 1,
              total: data.checkpoints.length,
            })}
          >
            <TextField
              label={t("checkpointLabel")}
              hint={t("checkpointLabelHint")}
              value={checkpoint.label}
              onChange={(label) => setCheckpoint(checkpoint.id, { label })}
            />

            <Field
              label={t("checkpointLine")}
              hint={t("checkpointLineHint")}
              error={errorFor(errors, `checkpoints.${index}.line`)}
            >
              {(props) => (
                <select
                  {...props}
                  className="bitflow-select"
                  value={checkpoint.line ?? ""}
                  onChange={(event) =>
                    setCheckpoint(checkpoint.id, {
                      line:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                    })
                  }
                >
                  <option value="">—</option>
                  {lines.map((line, number) => (
                    <option key={number} value={number + 1}>
                      {number + 1}: {line.trim()}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {data.columns.map((column, columnIndex) =>
              column.kind === "line" ? (
                <Field
                  key={column.id}
                  label={t("expectedLineFor", {
                    column: columnHeading(column, columnIndex),
                  })}
                  error={errorFor(
                    errors,
                    `checkpoints.${index}.expected.${column.id}`,
                  )}
                >
                  {(props) => (
                    <select
                      {...props}
                      className="bitflow-select"
                      value={checkpoint.expected[column.id] ?? ""}
                      onChange={(event) =>
                        setExpected(checkpoint, column.id, event.target.value)
                      }
                    >
                      <option value="">—</option>
                      {lines.map((line, number) => (
                        <option key={number} value={String(number + 1)}>
                          {number + 1}: {line.trim()}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <TextField
                  key={column.id}
                  label={t("expectedFor", {
                    column: columnHeading(column, columnIndex),
                  })}
                  value={checkpoint.expected[column.id] ?? ""}
                  onChange={(value) => setExpected(checkpoint, column.id, value)}
                />
              ),
            )}

            <div className="bitflow-row">
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                disabled={index === 0}
                onClick={() => moveCheckpoint(index, -1)}
              >
                {t("moveUp")}
              </button>
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                disabled={index === data.checkpoints.length - 1}
                onClick={() => moveCheckpoint(index, 1)}
              >
                {t("moveDown")}
              </button>
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() =>
                  patch({
                    checkpoints: data.checkpoints.filter(
                      (other) => other.id !== checkpoint.id,
                    ),
                  })
                }
              >
                {t("remove")}
              </button>
            </div>
          </Disclosure>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                checkpoints: [
                  ...data.checkpoints,
                  {
                    id: newId(
                      "checkpoint",
                      data.checkpoints.map((checkpoint) => checkpoint.id),
                    ),
                    label: "",
                    expected: {},
                  },
                ],
              })
            }
          >
            {t("addCheckpoint")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("showLineNumbersLabel")}
          hint={t("showLineNumbersHint")}
          checked={data.showLineNumbers}
          onChange={(showLineNumbers) => patch({ showLineNumbers })}
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
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
