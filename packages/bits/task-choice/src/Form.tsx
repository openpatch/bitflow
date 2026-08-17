import { createId, translate, type BitFormProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";
import type { Choice, Data } from "./schema";

/**
 * The teacher's editor for a choice task.
 *
 * Ordered the way the task is thought about — question, then the choices with
 * their correct marks, then everything else behind "Advanced". A teacher who
 * only wants a normal multiple-choice question never has to open the
 * disclosure, and never has to see a choice id.
 */
export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const updateChoice = (id: string, changes: Partial<Choice>) =>
    patch({
      choices: data.choices.map((choice) =>
        choice.id === id ? { ...choice, ...changes } : choice,
      ),
    });

  const addChoice = () =>
    patch({
      choices: [
        ...data.choices,
        { id: createId("choice"), markdown: "", correct: false },
      ],
    });

  const removeChoice = (id: string) =>
    patch({ choices: data.choices.filter((choice) => choice.id !== id) });

  /**
   * Switching to single-choice with several answers already marked would
   * produce a task nobody can answer. Keeping the first and clearing the rest
   * is the change the teacher meant.
   */
  const setVariant = (variant: Data["variant"]) => {
    if (variant === "multiple") {
      patch({ variant });
      return;
    }
    let seen = false;
    patch({
      variant,
      choices: data.choices.map((choice) => {
        if (!choice.correct) return choice;
        if (seen) return { ...choice, correct: false };
        seen = true;
        return choice;
      }),
    });
  };

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
        label={t("variantLabel")}
        value={data.variant}
        options={[
          { value: "single", label: t("variantSingle") },
          { value: "multiple", label: t("variantMultiple") },
        ]}
        onChange={setVariant}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("choicesLabel")}</legend>
        <span className="bitflow-hint">{t("choicesHint")}</span>

        <div className="bitflow-stack-small bitflow-stack">
          {data.choices.map((choice, index) => (
            <div key={choice.id} className="bitflow-choice-editor">
              <label className="bitflow-choice-editor-correct">
                <input
                  type={data.variant === "single" ? "radio" : "checkbox"}
                  name="bitflow-choice-editor-correct"
                  checked={choice.correct}
                  onChange={(event) =>
                    data.variant === "single"
                      ? patch({
                          choices: data.choices.map((c) => ({
                            ...c,
                            correct: c.id === choice.id && event.target.checked,
                          })),
                        })
                      : updateChoice(choice.id, { correct: event.target.checked })
                  }
                />
                <span className="bitflow-hint">{t("correctLabel")}</span>
              </label>

              <input
                type="text"
                className="bitflow-input"
                value={choice.markdown}
                placeholder={`${t("choicePlaceholder")} ${index + 1}`}
                aria-label={`${t("choicePlaceholder")} ${index + 1}`}
                onChange={(event) =>
                  updateChoice(choice.id, { markdown: event.target.value })
                }
              />

              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removeChoice")}
                title={t("removeChoice")}
                // Below two choices the task stops being a choice task, and the
                // schema would reject the document.
                disabled={data.choices.length <= 2}
                onClick={() => removeChoice(choice.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {errorFor(errors, "choices") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "choices")}
          </span>
        )}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={addChoice}
          >
            {t("addChoice")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("shuffleLabel")}
          hint={t("shuffleHint")}
          checked={data.shuffle}
          onChange={(shuffle) => patch({ shuffle })}
        />

        {data.variant === "multiple" && (
          <CheckboxField
            label={t("partialCreditLabel")}
            hint={t("partialCreditHint")}
            checked={data.partialCredit}
            onChange={(partialCredit) => patch({ partialCredit })}
          />
        )}

        <SelectField
          label={t("modeLabel")}
          value={data.evaluation.mode}
          options={[
            { value: "auto", label: t("modeAuto") },
            { value: "skip", label: t("modeSkip") },
          ]}
          onChange={(mode) =>
            patch({ evaluation: { ...data.evaluation, mode } })
          }
        />

        {/* Retry and feedback only mean anything for a graded task. */}
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
              label={t("feedbackLabel")}
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
