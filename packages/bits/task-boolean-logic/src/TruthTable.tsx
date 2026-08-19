import { translate, type Locale } from "@bitflow/core";
import type { ReactElement } from "react";
import type { CellStates } from "./evaluate";
import { format, valueOf } from "./expression";
import { messages } from "./messages";
import {
  cellValue,
  rowsOf,
  withCell,
  type Answer,
  type Column,
  type Data,
  type Row,
} from "./schema";

/**
 * The truth table: a row per assignment, a column per expression.
 *
 * A real `<table>` with row and column headers, so the relationship between a
 * cell and what it means survives being read out. The same component serves
 * the learner and the authoring preview — in the preview it is handed the
 * worked-out values and made read-only, so what the author checks is what the
 * class will see rather than a drawing of it.
 */
export const TruthTable = ({
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
  /** Overrides the caption; the authoring preview is not the learner's table. */
  caption?: string;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const rows = rowsOf(data);

  const heading = (column: Column, index: number) =>
    column.label || format(column.expression) || `${index + 1}`;

  /** "A is true and B is false" — how a row is said, for a cell's own label. */
  const describe = (row: Row) =>
    data.variables
      .map((name) =>
        t("isValue", { name, value: t(row.inputs[name] ? "true" : "false") }),
      )
      .join(t("andValue"));

  return (
    <div className="bitflow-truth-scroll">
      <table className="bitflow-truth-table">
        <caption className="bitflow-label">{caption ?? t("tableLabel")}</caption>
        <thead>
          <tr>
            {data.variables.map((name) => (
              <th key={name} scope="col" className="bitflow-truth-input-header">
                {name}
              </th>
            ))}
            {data.columns.map((column, index) => (
              <th key={column.id} scope="col">
                {heading(column, index)}
                {column.given && (
                  <span className="bitflow-truth-note">{t("given")}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {data.variables.map((name, position) => {
                const value = row.inputs[name];
                /* The first input column is the row's header. The rest are
                   cells: several `<th scope="row">` in one row would each
                   claim to name it, and a screen reader would read the whole
                   left-hand side before every value. */
                const Cell = position === 0 ? "th" : "td";
                return (
                  <Cell
                    key={name}
                    {...(position === 0 ? { scope: "row" as const } : {})}
                    className="bitflow-truth-input"
                  >
                    {t(value ? "true" : "false")}
                  </Cell>
                );
              })}

              {data.columns.map((column, index) => {
                const state = states?.[row.id]?.[column.id];
                /* A worked step shows its own value rather than the learner's:
                   it is part of the question, and it is never marked. */
                const value = column.given
                  ? valueOf(column.expression, row.inputs)
                  : cellValue(answer, row.id, column.id);
                const label = t("cellLabel", {
                  column: heading(column, index),
                  inputs: describe(row),
                });

                return (
                  <td
                    key={column.id}
                    className={
                      state
                        ? `bitflow-truth-cell bitflow-truth-cell-${state}`
                        : "bitflow-truth-cell"
                    }
                  >
                    {/*
                      A select rather than a checkbox. A checkbox has two
                      states and a cell has three — true, false, and not yet
                      answered — and a learner who has not reached a row must
                      not look like one who said false.
                    */}
                    <select
                      className="bitflow-select bitflow-truth-select"
                      aria-label={label}
                      value={value === null ? "" : value ? "1" : "0"}
                      disabled={readonly || column.given}
                      onChange={(event) =>
                        onChange(
                          withCell(
                            answer,
                            row.id,
                            column.id,
                            event.target.value === ""
                              ? null
                              : event.target.value === "1",
                          ),
                        )
                      }
                    >
                      <option value="">—</option>
                      <option value="1">{t("setTrue")}</option>
                      <option value="0">{t("setFalse")}</option>
                    </select>
                    {state && (
                      <span className="bitflow-visually-hidden">{t(state)}</span>
                    )}
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
