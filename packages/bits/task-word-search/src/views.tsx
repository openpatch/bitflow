import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  TextAreaField,
} from "@bitflow/element";
import { useMemo, type ReactElement } from "react";
import type { WordOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import { generate } from "./generate";
import {
  cellKey,
  cellsOf,
  DIRECTIONS,
  letterAt,
  lettersOf,
  type Answer,
  type Data,
  type Direction,
  type Word,
} from "./schema";
import { WordGrid } from "./WordGrid";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => (
  <div className="bitflow-stack">
    <Markdown markdown={data.instruction} />
    <WordGrid
      data={data}
      answer={{ found: answer?.found ?? [] }}
      outcomes={result?.detail?.words as WordOutcome[] | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

/** The words as the author types them: one per line. */
const asLines = (words: Word[]) => words.map((word) => word.text).join("\n");

/**
 * A stable id per word, reused while the word is unchanged.
 *
 * The words are edited as a block of text, so there is nothing to hang an id
 * on but the word itself — and an answer that named a word by position would
 * be wrong the moment the author inserted one above it.
 */
const asWords = (text: string, existing: Word[]): Word[] => {
  const spare = [...existing];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const index = spare.findIndex((word) => word.text === line);
      if (index !== -1) return spare.splice(index, 1)[0];
      return {
        id: `word-${line.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
        text: line,
        row: 0,
        column: 0,
        direction: "east" as Direction,
      };
    });
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

  const directions = data.directions;

  /**
   * Every change to the words, the size or the directions rebuilds the grid.
   *
   * The alternative is a button, and a button means a file that can be saved
   * with a grid that does not contain the words listed beside it. The
   * generator is deterministic, so the grid only moves when the author changes
   * something.
   */
  const rebuild = (
    changes: Partial<Data>,
    allowed: Direction[] = directions,
  ) => {
    const next = { ...data, ...changes, directions: allowed };
    const built = generate(next.words, {
      rows: next.rows,
      columns: next.columns,
      directions: allowed,
    });
    onChange({ ...next, letters: built.letters, words: built.words });
  };

  const unplaced = useMemo(
    () =>
      generate(data.words, {
        rows: data.rows,
        columns: data.columns,
        directions,
      }).unplaced,
    [data.words, data.rows, data.columns, directions],
  );

  const hidden = new Set(
    data.words.flatMap((word) =>
      lettersOf(word.text).length > 1
        ? cellsOf(word).map((cell) => cellKey(cell.row, cell.column))
        : [],
    ),
  );

  const size = (key: "rows" | "columns") => (
    <Field label={t(key)}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input"
          min={2}
          max={30}
          step={1}
          value={data[key]}
          onChange={(event) =>
            rebuild({
              [key]: Math.min(30, Math.max(2, Math.round(Number(event.target.value) || 2))),
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
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <TextAreaField
        label={t("wordsLabel")}
        hint={t("wordsHint")}
        rows={6}
        value={asLines(data.words)}
        error={errorFor(errors, "words")}
        onChange={(text) => rebuild({ words: asWords(text, data.words) })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("sizeLabel")}</legend>
        <span className="bitflow-hint">{t("sizeHint")}</span>
        <div className="bitflow-row">
          {size("rows")}
          {size("columns")}
        </div>
        {errorFor(errors, "letters") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "letters")}
          </span>
        )}
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("directionsLabel")}</legend>
        <span className="bitflow-hint">{t("directionsHint")}</span>
        {(Object.keys(DIRECTIONS) as Direction[]).map((direction) => (
          <CheckboxField
            key={direction}
            label={t(direction)}
            checked={directions.includes(direction)}
            onChange={(on) => {
              const next = on
                ? [...directions, direction]
                : directions.filter((other) => other !== direction);
              // Never all of them off: the generator would have nowhere to put
              // anything, and an empty grid is not a state worth reaching.
              rebuild({}, next.length > 0 ? next : [direction]);
            }}
          />
        ))}
      </fieldset>

      {unplaced.length > 0 && (
        <p className="bitflow-field-error" role="alert">
          {t("unplaced", { words: unplaced.map((word) => word.text).join(", ") })}
        </p>
      )}

      {data.letters.length === data.rows * data.columns && data.words.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("previewLabel")}</span>
          <span className="bitflow-hint">{t("previewHint")}</span>
          <div
            className="bitflow-wordsearch-grid bitflow-wordsearch-preview"
            style={{ "--bitflow-wordsearch-columns": data.columns } as never}
          >
            {Array.from({ length: data.rows }, (_row, row) => (
              <div key={row} className="bitflow-wordsearch-row">
                {Array.from({ length: data.columns }, (_column, column) => (
                  <span
                    key={column}
                    className={
                      hidden.has(cellKey(row, column))
                        ? "bitflow-wordsearch-cell bitflow-wordsearch-cell-found"
                        : "bitflow-wordsearch-cell"
                    }
                  >
                    <span className="bitflow-wordsearch-letter">
                      {letterAt(data, row, column)}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("showWordsLabel")}
          hint={t("showWordsHint")}
          checked={data.showWords}
          onChange={(showWords) => patch({ showWords })}
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
