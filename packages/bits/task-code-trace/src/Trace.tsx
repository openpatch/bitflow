import { translate, type Locale } from "@bitflow/core";
import type { ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { messages } from "./messages";
import {
  cellValue,
  linesOf,
  withCell,
  type Answer,
  type Column,
  type Data,
} from "./schema";

/**
 * The program, as text.
 *
 * `<code>` inside a list item per line rather than one `<pre>`: the lines are
 * separately addressable — a checkpoint marks one — and a marker sitting in a
 * `<pre>` would land inside the preformatted text and take its whitespace with
 * it. The number is real text rather than a CSS marker, so it is read out
 * alongside the line: a task that asks which line runs next is unanswerable if
 * you cannot tell which line you are hearing.
 */
export const CodeListing = ({
  data,
  locale,
  showNumbers,
}: {
  data: Data;
  locale: Locale;
  showNumbers: boolean;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const lines = linesOf(data.code);

  /** Line number → the checkpoints anchored to it. */
  const marks = new Map<number, string[]>();
  data.checkpoints.forEach((checkpoint, index) => {
    if (checkpoint.line === undefined) return;
    const label = checkpoint.label || t("unnamedStep", { number: index + 1 });
    marks.set(checkpoint.line, [...(marks.get(checkpoint.line) ?? []), label]);
  });

  return (
    <figure className="bitflow-trace-code">
      <figcaption className="bitflow-label">
        {data.language
          ? t("codeLabelIn", { language: data.language })
          : t("codeLabel")}
      </figcaption>
      <ol className="bitflow-trace-lines">
        {lines.map((line, index) => (
          <li key={index} className="bitflow-trace-line">
            {showNumbers && (
              <span className="bitflow-trace-number">{index + 1}</span>
            )}
            {/* A blank line still has to occupy one, or the numbering the
                learner is reading against stops matching the listing. */}
            <code>{line === "" ? " " : line}</code>
            {(marks.get(index + 1) ?? []).map((label) => (
              <span key={label} className="bitflow-trace-mark">
                {label}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </figure>
  );
};

/**
 * The trace table: a row per checkpoint, a column per thing being watched.
 *
 * A real `<table>` with row and column headers, so the relationship between a
 * cell and what it means survives being read out. Every control still carries
 * its own label, because a header association is not a label everywhere.
 */
export const TraceTable = ({
  data,
  answer,
  states,
  readonly,
  locale,
  onChange,
}: {
  data: Data;
  answer?: Answer;
  states?: CellStates;
  readonly?: boolean;
  locale: Locale;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const lines = linesOf(data.code);

  // Numbered when the author has left it blank, so two nameless columns do not
  // give their inputs the same label.
  const heading = (column: Column, index: number) =>
    column.name || `${t("unnamedColumn")} ${index + 1}`;

  const note = (column: Column) =>
    column.kind === "output"
      ? t("outputNote")
      : column.kind === "line"
        ? t("lineNote")
        : undefined;

  return (
    <div className="bitflow-trace-scroll">
      <table className="bitflow-trace-table">
        <caption className="bitflow-label">{t("tableLabel")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("stepHeader")}</th>
            {data.columns.map((column, index) => (
              <th key={column.id} scope="col">
                {heading(column, index)}
                {note(column) && (
                  <span className="bitflow-trace-note">{note(column)}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.checkpoints.map((checkpoint, row) => {
            const step =
              checkpoint.label || t("unnamedStep", { number: row + 1 });
            return (
              <tr key={checkpoint.id}>
                <th scope="row">
                  {step}
                  {checkpoint.line !== undefined && (
                    <span className="bitflow-trace-note">
                      {t("atLine", { line: checkpoint.line })}
                    </span>
                  )}
                </th>
                {data.columns.map((column, index) => {
                  const state = states?.[checkpoint.id]?.[column.id];
                  const value = cellValue(answer, checkpoint.id, column.id);
                  const label = t("cellLabel", {
                    column: heading(column, index),
                    step,
                  });
                  const set = (next: string) =>
                    onChange(withCell(answer, checkpoint.id, column.id, next));

                  return (
                    <td
                      key={column.id}
                      className={
                        state
                          ? `bitflow-trace-cell bitflow-trace-cell-${state}`
                          : "bitflow-trace-cell"
                      }
                    >
                      {column.kind === "line" ? (
                        <select
                          className="bitflow-select bitflow-trace-select"
                          aria-label={label}
                          value={value}
                          disabled={readonly}
                          onChange={(event) => set(event.target.value)}
                        >
                          <option value="">{t("lineChoose")}</option>
                          {lines.map((line, number) => (
                            <option key={number} value={String(number + 1)}>
                              {t("lineOption", {
                                line: number + 1,
                                text: line.trim(),
                              })}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="bitflow-input bitflow-trace-input"
                          aria-label={label}
                          value={value}
                          disabled={readonly}
                          onChange={(event) => set(event.target.value)}
                        />
                      )}
                      {state && (
                        <span className="bitflow-visually-hidden">
                          {t(state)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
