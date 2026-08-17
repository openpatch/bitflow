import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useId, type ReactElement } from "react";
import { messages } from "./messages";
import type { Answer, Data } from "./schema";

export const Task = ({
  data,
  answer,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const id = useId();
  const label = translate(messages, "answerLabel", locale);
  const shared = {
    id,
    className: data.multiline ? "bitflow-textarea" : "bitflow-input",
    value: answer?.input ?? "",
    disabled: readonly,
    placeholder: translate(messages, "placeholder", locale),
    onChange: (event: { target: { value: string } }) =>
      onAnswerChange({ input: event.target.value }),
  };

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <div className="bitflow-field">
        <label className="bitflow-label" htmlFor={id}>
          {label}
        </label>
        {data.multiline ? (
          <textarea {...shared} rows={5} />
        ) : (
          <input {...shared} type="text" />
        )}
      </div>
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        value={data.instruction}
        error={errorFor(errors, "instruction")}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField
        label={t("matchLabel")}
        value={data.matchMode}
        options={[
          { value: "exact", label: t("matchExact") },
          { value: "contains", label: t("matchContains") },
          { value: "regex", label: t("matchRegex") },
        ]}
        onChange={(matchMode) => patch({ matchMode })}
      />

      {data.matchMode === "regex" ? (
        <TextField
          label={t("patternLabel")}
          hint={t("patternHint")}
          value={data.pattern}
          error={errorFor(errors, "pattern")}
          onChange={(pattern) => patch({ pattern })}
        />
      ) : (
        <TextAreaField
          label={t("expectedLabel")}
          hint={t("expectedHint")}
          rows={3}
          // One accepted answer per line: a teacher listing synonyms should not
          // have to think about arrays.
          value={data.expected.join("\n")}
          error={errorFor(errors, "expected")}
          onChange={(value) => patch({ expected: value.split("\n") })}
        />
      )}

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("caseSensitiveLabel")}
          checked={data.caseSensitive}
          onChange={(caseSensitive) => patch({ caseSensitive })}
        />
        <CheckboxField
          label={t("trimLabel")}
          checked={data.trim}
          onChange={(trim) => patch({ trim })}
        />
        <CheckboxField
          label={t("multilineLabel")}
          checked={data.multiline}
          onChange={(multiline) => patch({ multiline })}
        />
        <SelectField
          label={t("modeLabel")}
          value={data.evaluation.mode}
          options={[
            { value: "auto", label: t("modeAuto") },
            { value: "manual", label: t("modeManual") },
            { value: "skip", label: t("modeSkip") },
          ]}
          onChange={(mode) => patch({ evaluation: { ...data.evaluation, mode } })}
        />
        {data.evaluation.mode === "auto" && (
          <>
            <CheckboxField
              label={t("retryLabel")}
              checked={data.evaluation.enableRetry}
              onChange={(enableRetry) =>
                patch({ evaluation: { ...data.evaluation, enableRetry } })
              }
            />
            <CheckboxField
              label={t("showFeedbackLabel")}
              checked={data.evaluation.showFeedback}
              onChange={(showFeedback) =>
                patch({ evaluation: { ...data.evaluation, showFeedback } })
              }
            />
          </>
        )}
      </Disclosure>
    </div>
  );
};
