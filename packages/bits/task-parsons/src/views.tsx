import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useMemo, type ReactElement } from "react";
import type { LineOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import { Puzzle } from "./Puzzle";
import type { Answer, Data, Line } from "./schema";
import { shuffledAwayFrom } from "./shuffle";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  attempt,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const ids = data.lines.map((line) => line.id);

  /*
   * The bank's order. Seeded from the attempt so it survives a reload, and
   * never dealt in the answer's order — a puzzle that starts solved hands out
   * full marks for doing nothing.
   */
  const order = useMemo(
    () =>
      shuffledAwayFrom(ids, attempt?.attemptId ?? "bitflow", (a, b) =>
        a.join() === b.join(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(), attempt?.attemptId],
  );

  const shuffled = useMemo(
    () =>
      order
        .map((id) => data.lines.find((line) => line.id === id))
        .filter((line): line is Line => line !== undefined),
    [order, data.lines],
  );

  // An answer written before the author removed a line would name one that is
  // gone, so it is filtered against what exists now.
  const placed = (answer?.lines ?? []).filter((entry) =>
    ids.includes(entry.lineId),
  );

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <Puzzle
        data={{ ...data, lines: shuffled }}
        placed={placed}
        outcomes={result?.detail?.lines as LineOutcome[] | undefined}
        locale={locale}
        readonly={readonly}
        onChange={(lines) => onAnswerChange({ lines })}
      />
    </div>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `line-${n}`;
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

  const setLine = (id: string, changes: Partial<Line>) =>
    patch({
      lines: data.lines.map((line) =>
        line.id === id ? { ...line, ...changes } : line,
      ),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.lines.length) return;
    const lines = [...data.lines];
    [lines[index], lines[to]] = [lines[to], lines[index]];
    patch({ lines });
  };

  const add = (distractor: boolean) =>
    patch({
      lines: [
        ...data.lines,
        {
          id: newId(data.lines.map((line) => line.id)),
          text: "",
          indent: 0,
          distractor,
        },
      ],
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

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("linesLabel")}</legend>
        <span className="bitflow-hint">{t("linesHint")}</span>
        {errorFor(errors, "lines") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "lines")}
          </span>
        )}
        {data.lines.length === 0 && (
          <p className="bitflow-text-muted">{t("noLines")}</p>
        )}

        {data.lines.map((line, index) => (
          <div key={line.id} className="bitflow-rule">
            <Disclosure
              summary={line.text || t("unnamedLine")}
              aside={
                line.distractor
                  ? t("isDistractor")
                  : t("atIndent", { indent: line.indent })
              }
            >
              <TextField
                label={t("lineText")}
                value={line.text}
                error={errorFor(errors, `lines.${index}.text`)}
                onChange={(text) => setLine(line.id, { text })}
              />

              <CheckboxField
                label={t("lineDistractor")}
                checked={line.distractor}
                onChange={(distractor) => setLine(line.id, { distractor })}
              />

              {!line.distractor && (
                <Field label={t("lineIndent")}>
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      className="bitflow-input"
                      min={0}
                      step={1}
                      value={line.indent}
                      onChange={(event) =>
                        setLine(line.id, {
                          indent: Math.max(
                            0,
                            Math.round(Number(event.target.value) || 0),
                          ),
                        })
                      }
                    />
                  )}
                </Field>
              )}

              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  {t("moveUp")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === data.lines.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {t("moveDown")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() =>
                    patch({
                      lines: data.lines.filter((other) => other.id !== line.id),
                    })
                  }
                >
                  {t("remove")}
                </button>
              </div>
            </Disclosure>
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add(false)}
          >
            {t("addLine")}
          </button>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add(true)}
          >
            {t("addDistractor")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("indentationLabel")}
          hint={t("indentationHint")}
          checked={data.indentationMatters}
          onChange={(indentationMatters) => patch({ indentationMatters })}
        />
        {errorFor(errors, "indentationMatters") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "indentationMatters")}
          </span>
        )}
        <CheckboxField
          label={t("penaliseLabel")}
          hint={t("penaliseHint")}
          checked={data.penaliseDistractors}
          onChange={(penaliseDistractors) => patch({ penaliseDistractors })}
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
