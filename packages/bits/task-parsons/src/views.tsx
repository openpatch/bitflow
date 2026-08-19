import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { LineOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import { Puzzle } from "./Puzzle";
import type { Answer, Data, Line } from "./schema";
import { shuffledAwayFrom } from "./shuffle";
import {
  asText,
  distractorLines,
  linesFrom,
  programLines,
  sameLines,
} from "./text";

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
   * The two boxes, as text.
   *
   * Held here rather than derived on every render, because `asText` writes
   * nesting back out at a fixed step: an author typing the second space of a
   * two-space indent would have it snapped away under the caret, and a
   * controlled textarea rewritten mid-keystroke puts the cursor at the end.
   * What they type stays exactly as typed; the document gets the meaning.
   */
  const [text, setText] = useState(() => ({
    program: asText(programLines(data.lines)),
    distractors: asText(distractorLines(data.lines)),
  }));

  /**
   * Re-seeded when the document says something the boxes do not — an undo, a
   * different step selected, a file loaded. Compared by what the text *means*,
   * so the author's own typing, which produced these very lines, never
   * reformats itself.
   */
  useEffect(() => {
    const shown = linesFrom(text.program, text.distractors, data.lines);
    if (sameLines(shown, data.lines)) return;
    setText({
      program: asText(programLines(data.lines)),
      distractors: asText(distractorLines(data.lines)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.lines]);

  const write = (changes: Partial<typeof text>) => {
    const next = { ...text, ...changes };
    setText(next);
    patch({ lines: linesFrom(next.program, next.distractors, data.lines) });
  };

  const solution = programLines(data.lines);

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

      {/* The program, typed as a program. A Parsons problem is a piece of code
          and its nesting, and both are things you write by writing them —
          paste the program in and the indentation you can see is the
          indentation that gets stored. */}
      <TextAreaField
        label={t("programLabel")}
        hint={t("programHint")}
        rows={10}
        value={text.program}
        placeholder={t("programPlaceholder")}
        error={errorFor(errors, "lines")}
        onChange={(program) => write({ program })}
      />

      <TextAreaField
        label={t("distractorsLabel")}
        hint={t("distractorsHint")}
        rows={4}
        value={text.distractors}
        onChange={(distractors) => write({ distractors })}
      />

      {/* What the boxes were understood to mean. The nesting is the half of a
          Parsons answer that is easiest to get wrong by a space, and reading
          it back as levels is the only way to see that it was read right. */}
      {solution.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("readAsLabel")}</span>
          <span className="bitflow-hint">{t("readAsHint")}</span>
          <ol className="bitflow-parsons-read">
            {solution.map((line) => (
              <li key={line.id} className="bitflow-parsons-read-line">
                <span className="bitflow-parsons-read-level">
                  {t("levelShort", { level: line.indent })}
                </span>
                <code>{line.text}</code>
              </li>
            ))}
          </ol>
        </div>
      )}

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
