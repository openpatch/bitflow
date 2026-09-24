import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  TextAreaField,
  TextField,
  usePanels,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import type { StackState } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import type { Answer, Checkpoint, Data, Frame } from "./schema";
import { CodeListing, Stacks } from "./Stacks";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const states = (result?.detail as { stacks?: StackState[] } | undefined)?.stacks;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <CodeListing data={data} locale={locale} />
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>
      <Stacks
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

/** Frames as the form edits them: one per line, top first, locals after a `|`. */
export const framesToText = (frames: Frame[]): string =>
  frames.map((frame) => (frame.locals ? `${frame.call} | ${frame.locals}` : frame.call)).join("\n");

export const textToFrames = (text: string): Frame[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      const bar = line.indexOf("|");
      return bar === -1
        ? { call: line, locals: "" }
        : { call: line.slice(0, bar).trim(), locals: line.slice(bar + 1).trim() };
    });

/**
 * A stack typed as lines. It keeps its own draft while the author types —
 * parsed and redrawn on every keystroke, the empty line a new frame starts on
 * would be dropped the instant Enter was pressed — and takes the stack from
 * outside only when that really changed.
 */
const FramesField = ({
  frames,
  onChange,
  ...field
}: {
  label: string;
  hint: string;
  error?: string;
  frames: Frame[];
  onChange: (frames: Frame[]) => void;
}): ReactElement => {
  const [text, setText] = useState(() => framesToText(frames));

  useEffect(() => {
    if (framesToText(textToFrames(text)) !== framesToText(frames)) setText(framesToText(frames));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  return (
    <Field {...field}>
      {(props) => (
        <textarea
          {...props}
          className="bitflow-textarea bitflow-callstack-frames"
          rows={4}
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => {
            setText(event.target.value);
            onChange(textToFrames(event.target.value));
          }}
        />
      )}
    </Field>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `moment-${n}`;
    if (!taken.includes(id)) return id;
  }
};

export const Form = ({ data, locale, onChange, errors }: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const panels = usePanels(data.checkpoints.map((checkpoint) => checkpoint.id));

  const setCheckpoint = (id: string, changes: Partial<Checkpoint>) =>
    patch({
      checkpoints: data.checkpoints.map((checkpoint) =>
        checkpoint.id === id ? { ...checkpoint, ...changes } : checkpoint,
      ),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.checkpoints.length) return;
    const checkpoints = [...data.checkpoints];
    [checkpoints[index], checkpoints[to]] = [checkpoints[to], checkpoints[index]];
    patch({ checkpoints });
  };

  /** A new moment starts from the stack of the last one, since the next moment
   *  of a run is usually one push or one pop away from it. */
  const addMoment = () =>
    patch({
      checkpoints: [
        ...data.checkpoints,
        {
          id: newId(data.checkpoints.map((checkpoint) => checkpoint.id)),
          label: "",
          expected: (data.checkpoints.at(-1)?.expected ?? []).map((frame) => ({ ...frame })),
        },
      ],
    });

  const frameErrors = (index: number) =>
    (errors ?? [])
      .filter((diagnostic) => diagnostic.path.startsWith(`checkpoints.${index}.expected.`))
      .map((diagnostic) => diagnostic.message)[0];

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
        <legend className="bitflow-label">{t("momentsLabel")}</legend>
        <span className="bitflow-hint">{t("momentsHint")}</span>
        {errorAt(errors, "checkpoints") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "checkpoints")}
          </span>
        )}
        {data.checkpoints.length === 0 && <p className="bitflow-text-muted">{t("noMoments")}</p>}

        {data.checkpoints.map((checkpoint, index) => (
          <div key={checkpoint.id} className="bitflow-rule">
            <Disclosure
              {...panels.props(checkpoint.id)}
              summary={checkpoint.label || t("unnamedMoment", { number: index + 1 })}
              aside={t("framesSummary", { count: checkpoint.expected.length })}
            >
              <TextField
                label={t("momentLabelLabel")}
                placeholder={t("momentLabelPlaceholder")}
                value={checkpoint.label}
                onChange={(label) => setCheckpoint(checkpoint.id, { label })}
              />
              <Field
                label={t("momentLineLabel")}
                hint={t("momentLineHint")}
                error={errorFor(errors, `checkpoints.${index}.line`)}
              >
                {(props) => (
                  <input
                    {...props}
                    type="number"
                    min={1}
                    step={1}
                    className="bitflow-input bitflow-callstack-line-input"
                    value={checkpoint.line ?? ""}
                    onChange={(event) => {
                      const line = Math.trunc(Number(event.target.value));
                      setCheckpoint(checkpoint.id, {
                        line: event.target.value === "" || line < 1 ? undefined : line,
                      });
                    }}
                  />
                )}
              </Field>
              <FramesField
                label={t("framesLabel")}
                hint={t("framesHint")}
                error={frameErrors(index)}
                frames={checkpoint.expected}
                onChange={(expected) => setCheckpoint(checkpoint.id, { expected })}
              />
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
                  disabled={index === data.checkpoints.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {t("moveDown")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() =>
                    patch({
                      checkpoints: data.checkpoints.filter((other) => other.id !== checkpoint.id),
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
          <button type="button" className="bitflow-button bitflow-button-secondary" onClick={addMoment}>
            {t("addMoment")}
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
          label={t("showLocalsLabel")}
          hint={t("showLocalsHint")}
          checked={data.showLocals}
          onChange={(showLocals) => patch({ showLocals })}
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
