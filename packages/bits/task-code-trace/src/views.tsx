import {
  translate,
  type BitFormProps,
  type BitTaskProps,
  type Diagnostic,
} from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  answerAsExpected,
  expectedAsAnswer,
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

  const columnHeading = (column: Column, index: number) =>
    column.name || `${t("unnamedColumn")} ${index + 1}`;

  const checkpointHeading = (checkpoint: Checkpoint, index: number) =>
    checkpoint.label || t("unnamedCheckpoint", { number: index + 1 });

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

  const moveIn = <T,>(list: T[], index: number, delta: number): T[] | undefined => {
    const to = index + delta;
    if (to < 0 || to >= list.length) return undefined;
    const next = [...list];
    [next[index], next[to]] = [next[to], next[index]];
    return next;
  };

  const moveColumn = (index: number, delta: number) => {
    const columns = moveIn(data.columns, index, delta);
    if (columns) patch({ columns });
  };

  const moveCheckpoint = (index: number, delta: number) => {
    const checkpoints = moveIn(data.checkpoints, index, delta);
    if (checkpoints) patch({ checkpoints });
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

      {/* Columns and checkpoints are the shape of the table — a heading and a
          kind, a name and a line. One row each, because a panel to open per
          column is four clicks to see what one glance should show, and the
          values they frame are filled in below rather than here. */}
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

        {data.columns.map((column, index) => (
          <div key={column.id} className="bitflow-stack-small bitflow-stack">
            <div className="bitflow-trace-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={column.name}
                placeholder={t("columnNamePlaceholder")}
                aria-label={t("columnNameOf", { position: index + 1 })}
                onChange={(event) =>
                  setColumn(column.id, { name: event.target.value })
                }
              />
              <select
                className="bitflow-select"
                value={column.kind}
                aria-label={t("columnKindOf", {
                  column: columnHeading(column, index),
                })}
                onChange={(event) =>
                  setColumn(column.id, {
                    kind: event.target.value as ColumnKind,
                  })
                }
              >
                <option value="value">{t("kindValue")}</option>
                <option value="output">{t("kindOutput")}</option>
                <option value="line">{t("kindLine")}</option>
              </select>
              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveLeftOf", {
                    column: columnHeading(column, index),
                  })}
                  disabled={index === 0}
                  onClick={() => moveColumn(index, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveRightOf", {
                    column: columnHeading(column, index),
                  })}
                  disabled={index === data.columns.length - 1}
                  onClick={() => moveColumn(index, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeColumnOf", {
                    column: columnHeading(column, index),
                  })}
                  onClick={() => removeColumn(column.id)}
                >
                  ×
                </button>
              </div>
            </div>
            {errorFor(errors, `columns.${index}.name`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `columns.${index}.name`)}
              </span>
            )}
          </div>
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
        {errorAt(errors, "checkpoints") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "checkpoints")}
          </span>
        )}
        {data.checkpoints.length === 0 && (
          <p className="bitflow-text-muted">{t("noCheckpoints")}</p>
        )}

        {data.checkpoints.map((checkpoint, index) => (
          <div key={checkpoint.id} className="bitflow-stack-small bitflow-stack">
            <div className="bitflow-trace-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={checkpoint.label}
                placeholder={t("checkpointLabelPlaceholder")}
                aria-label={t("checkpointLabelOf", { position: index + 1 })}
                onChange={(event) =>
                  setCheckpoint(checkpoint.id, { label: event.target.value })
                }
              />
              <select
                className="bitflow-select"
                value={checkpoint.line ?? ""}
                aria-label={t("checkpointLineOf", {
                  step: checkpointHeading(checkpoint, index),
                })}
                onChange={(event) =>
                  setCheckpoint(checkpoint.id, {
                    line:
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                  })
                }
              >
                <option value="">{t("checkpointLineNone")}</option>
                {lines.map((line, number) => (
                  <option key={number} value={number + 1}>
                    {number + 1}: {line.trim()}
                  </option>
                ))}
              </select>
              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveUpOf", {
                    step: checkpointHeading(checkpoint, index),
                  })}
                  disabled={index === 0}
                  onClick={() => moveCheckpoint(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("moveDownOf", {
                    step: checkpointHeading(checkpoint, index),
                  })}
                  disabled={index === data.checkpoints.length - 1}
                  onClick={() => moveCheckpoint(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  aria-label={t("removeCheckpointOf", {
                    step: checkpointHeading(checkpoint, index),
                  })}
                  onClick={() =>
                    patch({
                      checkpoints: data.checkpoints.filter(
                        (other) => other.id !== checkpoint.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </div>
            </div>
            {errorFor(errors, `checkpoints.${index}.line`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `checkpoints.${index}.line`)}
              </span>
            )}
          </div>
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

      {/* The answer key, in the learner's own table.
          The author fills in the grid the class will fill in, sees the whole
          of it at once, and reads down a column the way a trace is checked.
          It is the same component, so the two cannot drift apart — and a
          `line` column offers the program's lines here exactly as it will
          there. */}
      <div className="bitflow-field">
        <span className="bitflow-hint">{t("answerKeyHint")}</span>
        {data.columns.length === 0 || data.checkpoints.length === 0 ? (
          <p className="bitflow-text-muted">{t("answerKeyEmpty")}</p>
        ) : (
          <>
            <TraceTable
              data={data}
              answer={expectedAsAnswer(data)}
              locale={locale}
              caption={t("answerKeyLabel")}
              onChange={(answer) =>
                patch({ checkpoints: answerAsExpected(data.checkpoints, answer) })
              }
            />
            {expectedErrors(errors).map((diagnostic) => (
              <span
                key={diagnostic.path}
                className="bitflow-field-error"
                role="alert"
              >
                {diagnostic.message}
              </span>
            ))}
          </>
        )}
      </div>

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

/**
 * The diagnostics about the values in the table.
 *
 * They are reported against `checkpoints.<n>.expected.<column>`, which is a
 * cell rather than a field with a label — so they are collected under the
 * table instead of being dropped for want of somewhere to sit.
 */
const expectedErrors = (errors: Diagnostic[] | undefined): Diagnostic[] =>
  (errors ?? []).filter((diagnostic) =>
    /^checkpoints\.\d+\.expected\./.test(diagnostic.path),
  );
