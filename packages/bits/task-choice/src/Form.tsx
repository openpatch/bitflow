import { createId, translate, type BitFormProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import { useId, type ReactElement } from "react";
import { formMessages as messages } from "./formMessages";
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
  // Radios only form a group when they share a name, and only within one form.
  // A literal name would join the radios of every choice editor on the page —
  // two steps of a flow, or two bits in a gallery — into a single group, where
  // marking a correct answer in one clears it in the other.
  const group = useId();
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
   * Order matters even when the choices are shuffled: it is the order the
   * author reads them back in, and "none of the above" has to be last for
   * anyone who turns shuffling off.
   */
  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.choices.length) return;
    const choices = [...data.choices];
    [choices[index], choices[to]] = [choices[to], choices[index]];
    patch({ choices });
  };

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
                  name={group}
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

              {/* Grouped, so in a narrow inspector all three wrap together
                  under the text they act on rather than one of them alone. */}
              <div className="bitflow-row bitflow-choice-editor-actions">
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("moveChoiceUp")}
                title={t("moveChoiceUp")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>

              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("moveChoiceDown")}
                title={t("moveChoiceDown")}
                disabled={index === data.choices.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>

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

        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
