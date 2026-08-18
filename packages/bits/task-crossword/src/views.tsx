import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { Crossword } from "./Crossword";
import type { WordOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import { gridOf } from "./grid";
import { layout } from "./layout";
import { cellKey, type Answer, type Data, type Word } from "./schema";

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
    <Crossword
      data={data}
      answer={{ letters: answer?.letters ?? {} }}
      outcomes={result?.detail?.words as WordOutcome[] | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `word-${n}`;
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

  /**
   * Every change to the answers re-lays the grid.
   *
   * The alternative is a button, and a button means a file that can be saved
   * with words in one arrangement and clues describing another. The generator
   * is deterministic, so the same words always come back to the same places
   * and the preview only moves when the author changes something.
   */
  const setWords = (words: Word[], relayout = true) =>
    patch({ words: relayout ? layout(words).words : words });

  const setWord = (id: string, changes: Partial<Word>, relayout = true) =>
    setWords(
      data.words.map((word) => (word.id === id ? { ...word, ...changes } : word)),
      relayout,
    );

  const unplaced = layout(data.words).unplaced;
  const grid = gridOf(data);

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("wordsLabel")}</legend>
        <span className="bitflow-hint">{t("wordsHint")}</span>
        {errorFor(errors, "words") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "words")}
          </span>
        )}
        {data.words.length === 0 && (
          <p className="bitflow-text-muted">{t("noWords")}</p>
        )}

        {data.words.map((word, index) => {
          const placed = grid.words.find((candidate) => candidate.id === word.id);
          return (
            <div key={word.id} className="bitflow-rule">
              <Disclosure
                summary={word.answer || t("unnamedWord")}
                aside={
                  placed
                    ? t("atPlace", {
                        number: placed.number,
                        direction: t(placed.orientation),
                      })
                    : t("notPlaced")
                }
              >
                <TextField
                  label={t("answerLabel")}
                  hint={t("answerHint")}
                  value={word.answer}
                  error={errorFor(errors, `words.${index}.answer`)}
                  onChange={(answer) => setWord(word.id, { answer })}
                />
                <TextField
                  label={t("clueLabel")}
                  value={word.clue}
                  error={errorFor(errors, `words.${index}.clue`)}
                  // A clue is not part of the shape of the grid, so editing it
                  // must not move the words around under the author.
                  onChange={(clue) => setWord(word.id, { clue }, false)}
                />
                <div className="bitflow-row">
                  <button
                    type="button"
                    className="bitflow-button bitflow-button-quiet"
                    onClick={() =>
                      setWords(data.words.filter((other) => other.id !== word.id))
                    }
                  >
                    {t("remove")}
                  </button>
                </div>
              </Disclosure>
            </div>
          );
        })}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              setWords(
                [
                  ...data.words,
                  {
                    id: newId(data.words.map((word) => word.id)),
                    clue: "",
                    answer: "",
                    row: 0,
                    column: 0,
                    orientation: "across" as const,
                  },
                ],
                false,
              )
            }
          >
            {t("addWord")}
          </button>
        </div>

        {unplaced.length > 0 && (
          <p className="bitflow-field-error" role="alert">
            {t("unplaced", {
              words: unplaced.map((word) => word.answer).join(", "),
            })}
          </p>
        )}
      </fieldset>

      {grid.words.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("previewLabel")}</span>
          <span className="bitflow-hint">{t("previewHint")}</span>
          <div
            className="bitflow-crossword-grid bitflow-crossword-preview"
            style={{ "--bitflow-crossword-columns": grid.columns } as never}
          >
            {Array.from({ length: grid.rows }, (_row, row) => (
              <div key={row} className="bitflow-crossword-row">
                {Array.from({ length: grid.columns }, (_column, column) => {
                  const cell = grid.cells.get(cellKey(row, column));
                  return cell ? (
                    <span key={column} className="bitflow-crossword-cell">
                      {cell.number !== undefined && (
                        <span className="bitflow-crossword-number">
                          {cell.number}
                        </span>
                      )}
                      <span className="bitflow-crossword-solution">
                        {cell.solution}
                      </span>
                    </span>
                  ) : (
                    <span key={column} className="bitflow-crossword-blank" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        <SelectField
          label={t("scoringLabel")}
          hint={t("scoringHint")}
          value={data.scoring}
          options={[
            { value: "words" as const, label: t("scoringWords") },
            { value: "letters" as const, label: t("scoringLetters") },
          ]}
          onChange={(scoring) => patch({ scoring })}
        />
        <CheckboxField
          label={t("penaliseLabel")}
          hint={t("penaliseHint")}
          checked={data.penaliseWrong}
          onChange={(penaliseWrong) => patch({ penaliseWrong })}
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
