import { translate, type Evaluation, type Locale } from "@bitflow/core";
import type { ReactElement } from "react";
import { CheckboxField, Field, SecondsField, SelectField } from "./form";
import { messages } from "./messages";

/**
 * The grading settings every task bit shares.
 *
 * One component rather than a copy in each bit's form: a teacher meets the same
 * questions in the same order whichever task they are editing, and a new
 * setting — weight and the time limit are the latest — reaches every bit at
 * once instead of being added five times and forgotten on the sixth.
 */
export const EvaluationFields = ({
  evaluation,
  locale,
  onChange,
}: {
  evaluation: Evaluation;
  locale: Locale;
  onChange: (evaluation: Evaluation) => void;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const patch = (changes: Partial<Evaluation>) =>
    onChange({ ...evaluation, ...changes });

  return (
    <>
      <SelectField
        label={t("modeLabel")}
        value={evaluation.mode}
        options={[
          { value: "auto", label: t("modeAuto") },
          { value: "skip", label: t("modeSkip") },
        ]}
        onChange={(mode) => patch({ mode })}
      />

      {/* Retry, feedback and weight only mean anything for a graded task. */}
      {evaluation.mode === "auto" && (
        <>
          <CheckboxField
            label={t("retryLabel")}
            checked={evaluation.enableRetry}
            onChange={(enableRetry) => patch({ enableRetry })}
          />
          <CheckboxField
            label={t("showFeedbackLabel")}
            checked={evaluation.showFeedback}
            onChange={(showFeedback) => patch({ showFeedback })}
          />
          <Field label={t("weightLabel")} hint={t("weightHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={0}
                step={0.5}
                // A flow authored before weights existed has none stored; the
                // schema treats that as 1, so the teacher should read 1.
                value={evaluation.weight ?? 1}
                onChange={(event) => {
                  const weight = Number(event.target.value);
                  // Emptying the box means "back to normal", not "worth zero".
                  patch({
                    weight:
                      event.target.value === "" || !Number.isFinite(weight)
                        ? 1
                        : Math.max(0, weight),
                  });
                }}
              />
            )}
          </Field>
        </>
      )}

      <SecondsField
        label={t("timeLimitLabel")}
        hint={t("timeLimitHint")}
        value={evaluation.timeLimit}
        onChange={(timeLimit) => patch({ timeLimit })}
      />
    </>
  );
};
