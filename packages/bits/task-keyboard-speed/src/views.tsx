import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import type { Measurement } from "./evaluate";
import { formMessages } from "./formMessages";
import type { Answer, Data } from "./schema";
import { Typist } from "./Typist";

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
    <Typist
      data={data}
      answer={{
        typed: answer?.typed ?? "",
        elapsedMs: answer?.elapsedMs ?? 0,
        optedOut: answer?.optedOut ?? false,
      }}
      measurement={result?.detail as Measurement | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

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
        label={t("textLabel")}
        hint={t("textHint")}
        rows={4}
        value={data.text}
        error={errorFor(errors, "text")}
        onChange={(text) => patch({ text })}
      />

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("timedLabel")}
          hint={t("timedHint")}
          checked={data.timed}
          onChange={(timed) =>
            // Speed cannot be counted off the clock, so switching timing off
            // takes the task back to accuracy rather than leaving a mark
            // nobody can earn.
            patch({
              timed,
              scoring: timed ? data.scoring : "accuracy",
            })
          }
        />

        <SelectField
          label={t("scoringLabel")}
          hint={t("scoringHint")}
          value={data.scoring}
          options={[
            { value: "accuracy" as const, label: t("scoringAccuracy") },
            ...(data.timed
              ? [
                  {
                    value: "accuracyAndSpeed" as const,
                    label: t("scoringAccuracyAndSpeed"),
                  },
                ]
              : []),
          ]}
          onChange={(scoring) => patch({ scoring })}
        />
        {errorFor(errors, "scoring") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "scoring")}
          </span>
        )}

        <Field label={t("accuracyLabel")} hint={t("accuracyHint")}>
          {(props) => (
            <input
              {...props}
              type="number"
              className="bitflow-input"
              min={0}
              max={100}
              step={1}
              value={Math.round(data.requiredAccuracy * 100)}
              onChange={(event) =>
                patch({
                  requiredAccuracy:
                    Math.min(100, Math.max(0, Number(event.target.value) || 0)) / 100,
                })
              }
            />
          )}
        </Field>

        {data.scoring === "accuracyAndSpeed" && (
          <Field label={t("wpmLabel")} hint={t("wpmHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={5}
                max={200}
                step={1}
                value={data.targetWpm}
                onChange={(event) =>
                  patch({
                    targetWpm: Math.min(
                      200,
                      Math.max(5, Math.round(Number(event.target.value) || 5)),
                    ),
                  })
                }
              />
            )}
          </Field>
        )}

        <CheckboxField
          label={t("optOutLabel")}
          hint={t("optOutHint")}
          checked={data.allowOptOut}
          onChange={(allowOptOut) => patch({ allowOptOut })}
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
