import { translate, type Locale } from "@bitflow/core";
import { useEffect, useState, type ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  acceptedToText,
  answerCell,
  cellKey,
  isGivenCell,
  textToAccepted,
  withAnswerCell,
  type Answer,
  type Cell,
  type Column,
  type ColumnKind,
  type Data,
  type Row,
} from "./schema";

/** Numbered when the author has left it blank, so two nameless columns do not give their inputs the same label. */
export const columnHeading = (column: Column, index: number, t: (key: string, vars?: Record<string, string | number>) => string): string =>
  column.header || t("unnamedColumn", { number: index + 1 });

export const rowHeading = (row: Row, index: number, t: (key: string, vars?: Record<string, string | number>) => string): string =>
  row.header || t("unnamedRow", { number: index + 1 });

/** A missing cell reads as an unanswerable blank rather than throwing — see the `parseFlow` trap in CLAUDE.md. */
const cellOf = (row: Row, columnId: string): Cell => row.cells[columnId] ?? { accepted: [] };

/**
 * Always a full keyboard, numbers included. The iPhone's decimal keypad has no
 * minus key, so a value table or a confusion-matrix difference with a negative
 * entry would be untypeable there; and choosing the keypad per column from
 * whether any answer in it is negative would tell the learner exactly that.
 */
const inputModeOf = (_kind: ColumnKind): "text" => "text";

/**
 * The learner's table: a real `<table>` with row and column headers, given
 * cells shown as text and blank cells as inputs, marked cell by cell.
 *
 * The same component draws the authoring form's answer key (`views.tsx`
 * passes each row's first accepted answer in as the value there), which is
 * why marking and display both live on `Data`/`Answer` rather than on props
 * only `Task` would ever pass.
 */
export const FillableTable = ({
  data,
  answer,
  states,
  readonly,
  locale,
  caption,
  onChange,
}: {
  data: Data;
  answer?: Answer;
  states?: CellStates;
  readonly?: boolean;
  locale: Locale;
  /** Overrides the caption — the authoring form shows this same table as the answer key. */
  caption?: string;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) => translate(messages, key, locale, vars);

  return (
    <div className="bitflow-table-scroll">
      <table className="bitflow-table">
        <caption className="bitflow-label">
          {caption ?? (data.caption.trim() !== "" ? data.caption : t("tableLabel"))}
        </caption>
        <thead>
          <tr>
            {data.rowHeaders && <th scope="col" />}
            {data.columns.map((column, index) => (
              <th key={column.id} scope="col">
                {columnHeading(column, index, t)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={row.id}>
              {data.rowHeaders && <th scope="row">{rowHeading(row, rowIndex, t)}</th>}
              {data.columns.map((column, columnIndex) => {
                const cell = cellOf(row, column.id);
                const rowLabel = rowHeading(row, rowIndex, t);
                const columnLabel = columnHeading(column, columnIndex, t);

                if (isGivenCell(cell)) {
                  return (
                    <td key={column.id} className="bitflow-table-cell bitflow-table-cell-given">
                      {cell.given}
                    </td>
                  );
                }

                const state = states?.[cellKey(row.id, column.id)];
                const value = answerCell(answer, row.id, column.id);
                const label = t("cellLabel", { column: columnLabel, row: rowLabel });

                return (
                  <td
                    key={column.id}
                    className={
                      state ? `bitflow-table-cell bitflow-table-cell-${state}` : "bitflow-table-cell"
                    }
                  >
                    <input
                      type="text"
                      inputMode={inputModeOf(column.kind)}
                      className="bitflow-input bitflow-table-input"
                      aria-label={label}
                      value={value}
                      disabled={readonly}
                      // A table answer is data, not prose: a formula or a query
                      // result should never be "corrected" to a capital letter
                      // or a dictionary spelling.
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(event) =>
                        onChange(withAnswerCell(answer, row.id, column.id, event.target.value))
                      }
                    />
                    {state && <span className="bitflow-visually-hidden">{t(state)}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * The authoring grid: the same shape of table, but every cell is editable —
 * given or blank, and what either of those holds.
 *
 * A `<select>` per cell rather than a checkbox, so the two states read as
 * "given" and "blank" rather than "on" and "off" — this is the one piece of
 * the form where that distinction is the entire point. The list of accepted
 * answers is a single line of text rather than a list editor per cell: a
 * table already has one row per answer to write, and a second nested list per
 * cell would be a lot of chrome for what is usually one or two spellings.
 */
export const TableEditor = ({
  data,
  locale,
  onChange,
}: {
  data: Data;
  locale: Locale;
  onChange: (rows: Row[]) => void;
}): ReactElement => {
  // Fallback headings ("Column 2") come from the learner-facing catalog, the
  // same text `FillableTable` would show for the same blank heading; every
  // other label here is authoring-only and lives in `formMessages`.
  const tLearner = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);

  const setCell = (rowId: string, columnId: string, cell: Cell) =>
    onChange(
      data.rows.map((row) => (row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: cell } } : row)),
    );

  return (
    <div className="bitflow-table-scroll">
      <table className="bitflow-table">
        <caption className="bitflow-label">{t("answerKeyLabel")}</caption>
        <thead>
          <tr>
            {data.rowHeaders && <th scope="col" />}
            {data.columns.map((column, index) => (
              <th key={column.id} scope="col">
                {columnHeading(column, index, tLearner)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={row.id}>
              {data.rowHeaders && <th scope="row">{rowHeading(row, rowIndex, tLearner)}</th>}
              {data.columns.map((column, columnIndex) => {
                const cell = cellOf(row, column.id);
                const rowLabel = rowHeading(row, rowIndex, tLearner);
                const columnLabel = columnHeading(column, columnIndex, tLearner);
                const given = isGivenCell(cell);

                return (
                  <td key={column.id} className="bitflow-table-cell">
                    <div className="bitflow-table-cell-editor">
                      <select
                        className="bitflow-select bitflow-table-select"
                        aria-label={t("cellKindOf", { column: columnLabel, row: rowLabel })}
                        value={given ? "given" : "blank"}
                        onChange={(event) =>
                          setCell(
                            row.id,
                            column.id,
                            // What was written carries over, so switching a
                            // cell to blank makes its text the answer rather
                            // than throwing it away — and back again.
                            event.target.value === "given"
                              ? { given: isGivenCell(cell) ? cell.given : (cell.accepted[0] ?? "") }
                              : { accepted: isGivenCell(cell) && cell.given.trim() !== "" ? [cell.given] : [] },
                          )
                        }
                      >
                        <option value="given">{t("cellKindGiven")}</option>
                        <option value="blank">{t("cellKindBlank")}</option>
                      </select>
                      {given ? (
                        <input
                          type="text"
                          className="bitflow-input bitflow-table-input"
                          aria-label={t("cellGivenValueOf", { column: columnLabel, row: rowLabel })}
                          placeholder={t("cellGivenPlaceholder")}
                          value={cell.given}
                          onChange={(event) => setCell(row.id, column.id, { given: event.target.value })}
                        />
                      ) : (
                        <AcceptedInput
                          accepted={cell.accepted}
                          label={t("cellBlankValueOf", { column: columnLabel, row: rowLabel })}
                          placeholder={t("cellBlankPlaceholder")}
                          onChange={(accepted) => setCell(row.id, column.id, { accepted })}
                        />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * The accepted answers for a blank cell, typed as one line split on `|`.
 *
 * Holds its own text while the author types. Parsed on every keystroke and
 * shown back from the parse, "a |" would lose its separator the instant it was
 * typed — the empty alternative after it is dropped — and a second answer could
 * never be started. The text is only replaced from outside when the list it
 * stands for really changed, not merely re-spaced.
 */
const AcceptedInput = ({
  accepted,
  label,
  placeholder,
  onChange,
}: {
  accepted: string[];
  label: string;
  placeholder: string;
  onChange: (accepted: string[]) => void;
}): ReactElement => {
  const [text, setText] = useState(() => acceptedToText(accepted));

  useEffect(() => {
    if (textToAccepted(text).join("\u0000") !== accepted.join("\u0000")) {
      setText(acceptedToText(accepted));
    }
    // Only a change from outside should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted]);

  return (
    <input
      type="text"
      className="bitflow-input bitflow-table-input"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      onChange={(event) => {
        setText(event.target.value);
        onChange(textToAccepted(event.target.value));
      }}
    />
  );
};
