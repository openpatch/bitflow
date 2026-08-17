import { translate, type BitTaskProps } from "@bitflow/core";
import { Markdown } from "@bitflow/element";
import { useMemo, type ReactElement } from "react";
import { messages } from "./messages";
import type { Answer, ChoiceState, Data } from "./schema";

/**
 * The learner's view.
 *
 * Native radios and checkboxes inside labels, rather than the old
 * `role="checkbox"` divs with hand-written key handling: the browser then
 * supplies arrow-key navigation within a radio group, the checked state, the
 * accessible name and the touch target, and none of it can drift.
 */
export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const selected = answer?.selected ?? [];
  const states = (result?.detail?.choices ?? {}) as Record<string, ChoiceState>;
  const single = data.variant === "single";

  // Shuffled once per mount, keyed by the choice list: re-shuffling on every
  // keystroke would move an option out from under the learner's cursor.
  const choices = useMemo(
    () => (data.shuffle ? shuffle(data.choices) : data.choices),
    [data.shuffle, data.choices],
  );

  const toggle = (id: string, checked: boolean) => {
    if (single) {
      onAnswerChange({ selected: checked ? [id] : [] });
      return;
    }
    onAnswerChange({
      selected: checked
        ? [...selected, id]
        : selected.filter((current) => current !== id),
    });
  };

  // One name per task instance keeps two tasks on the same page from sharing a
  // radio group; `useMemo` over the choice ids is stable enough for that.
  const groupName = useMemo(
    () => `bitflow-choice-${data.choices.map((c) => c.id).join("-")}`,
    [data.choices],
  );

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />

      <fieldset className="bitflow-choice-group">
        <legend className="bitflow-visually-hidden">
          {translate(
            messages,
            single ? "legendSingle" : "legendMultiple",
            locale,
          )}
        </legend>

        {choices.map((choice) => {
          const state = states[choice.id];
          return (
            <label
              key={choice.id}
              className={
                state && state !== "neutral"
                  ? `bitflow-option bitflow-option-${state}`
                  : "bitflow-option"
              }
            >
              <input
                type={single ? "radio" : "checkbox"}
                name={single ? groupName : undefined}
                checked={selected.includes(choice.id)}
                disabled={readonly}
                onChange={(event) => toggle(choice.id, event.target.checked)}
              />
              <Markdown markdown={choice.markdown} />
              {state && state !== "neutral" && (
                <span className="bitflow-visually-hidden">
                  {translate(messages, state, locale)}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
};

/** Fisher–Yates on a copy; the caller's array is the authored order. */
const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
