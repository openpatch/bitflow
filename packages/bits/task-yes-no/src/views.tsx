import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";
import type { Answer, Data } from "./schema";

export const Task = ({
  data,
  answer,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.question} />

      <fieldset className="bitflow-yes-no">
        <legend className="bitflow-visually-hidden">{t("legend")}</legend>
        {[true, false].map((value) => (
          <label key={String(value)} className="bitflow-option">
            <input
              type="radio"
              name="bitflow-yes-no"
              checked={answer?.yes === value}
              disabled={readonly}
              onChange={() => onAnswerChange({ yes: value })}
            />
            <span>{value ? t("yes") : t("no")}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("questionLabel")}
        hint={t("questionHint")}
        value={data.question}
        onChange={(question) => patch({ question })}
      />

      <SelectField
        label={t("correctLabel")}
        value={data.correctAnswer ? "yes" : "no"}
        options={[
          { value: "yes", label: t("yes") },
          { value: "no", label: t("no") },
        ]}
        onChange={(value) => patch({ correctAnswer: value === "yes" })}
      />

      {/* Feedback belongs to the wrong answer, so it is only worth asking for
          when the task is graded here in the browser. */}
      {data.evaluation.mode === "auto" && (
        <>
          <TextField
            label={t("feedbackYesLabel")}
            hint={t("feedbackHint")}
            value={data.feedbackWhenYes?.message ?? ""}
            onChange={(message) =>
              patch({
                feedbackWhenYes: message ? { message, severity: "info" } : undefined,
              })
            }
          />
          <TextField
            label={t("feedbackNoLabel")}
            hint={t("feedbackHint")}
            value={data.feedbackWhenNo?.message ?? ""}
            onChange={(message) =>
              patch({
                feedbackWhenNo: message ? { message, severity: "info" } : undefined,
              })
            }
          />
        </>
      )}

      <Disclosure summary={t("advanced")}>
        <SelectField
          label={t("modeLabel")}
          value={data.evaluation.mode}
          options={[
            { value: "auto", label: t("modeAuto") },
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
