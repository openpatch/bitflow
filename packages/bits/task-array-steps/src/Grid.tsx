import { translate, type Locale } from "@bitflow/core";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { messages } from "./messages";
import {
  carryForward,
  displayRow,
  slotCountOf,
  withRow,
  type Answer,
  type Data,
  type Step,
} from "./schema";
import type { StepState } from "./evaluate";

/** A box being held, waiting for the second tap that swaps it. Scoped to one
 *  step's row: a swap only ever happens inside a single array, never between
 *  two different moments of the algorithm. */
type Held = { stepId: string; index: number };

/** A row of boxes, index numbers included. The index sits with its box rather
 *  than in a row of its own, so the two travel together when the boxes wrap
 *  onto a second line on a narrow screen. */
const Cells = ({
  values,
  showIndices,
  render,
}: {
  values: string[];
  showIndices: boolean;
  render: (value: string, index: number) => ReactNode;
}): ReactElement => (
  <ul className="bitflow-array-cells">
    {values.map((value, index) => (
      <li key={index} className="bitflow-array-slot">
        {showIndices && (
          <span className="bitflow-array-index" aria-hidden="true">
            {index}
          </span>
        )}
        {render(value, index)}
      </li>
    ))}
  </ul>
);

/** The starting array. Always read-only: it is given, not answered. */
export const InitialRow = ({
  data,
  locale,
}: {
  data: Data;
  locale: Locale;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  return (
    <div className="bitflow-array-block">
      <span className="bitflow-label">{t("initialLabel")}</span>
      <Cells
        values={data.initial}
        showIndices={data.showIndices}
        render={(value) => (
          <span className="bitflow-array-cell bitflow-array-cell-fixed">{value}</span>
        )}
      />
    </div>
  );
};

/**
 * Every step's row, editable by tap-and-tap or by typing depending on
 * `data.mode`.
 *
 * A real `<button>` per box in rearrange mode: it is keyboard-operable for
 * free, and Enter or Space is exactly "pick this up or swap with it" without a
 * key handler of its own. Arrow keys move focus between boxes; Escape cancels
 * a pick-up the same way it does everywhere else in bitflow.
 */
export const StepsGrid = ({
  data,
  answer,
  states,
  readonly,
  locale,
  onChange,
}: {
  data: Data;
  answer?: Answer;
  states?: StepState[];
  readonly?: boolean;
  locale: Locale;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [held, setHeld] = useState<Held | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const cellsRef = useRef(new Map<string, HTMLElement>());
  const marked = states !== undefined;

  const stepLabel = (step: Step, index: number) =>
    step.label || t("unnamedStep", { number: index + 1 });

  const shown = (value: string) => (value.trim() === "" ? t("emptyCell") : value);

  // Escape puts a held box down, the way every other pick-up in bitflow does.
  useEffect(() => {
    if (!held) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHeld(null);
      setAnnouncement(t("putDown"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, locale]);

  const focusCell = (stepId: string, index: number) => {
    cellsRef.current.get(`${stepId}:${index}`)?.focus();
  };

  const pick = (stepId: string, index: number, step: Step, stepIndex: number) => {
    if (readonly) return;
    const row = carryForward(data, answer, stepIndex);

    if (!held) {
      setHeld({ stepId, index });
      setAnnouncement(
        t("holding", { value: shown(row[index]), step: stepLabel(step, stepIndex) }),
      );
      return;
    }

    if (held.stepId === stepId && held.index === index) {
      setHeld(null);
      setAnnouncement(t("putDown"));
      return;
    }

    if (held.stepId !== stepId) {
      // A swap only ever happens inside one row, so choosing a box in a
      // different step's row moves the pick-up there instead of attempting a
      // cross-row swap that could never be a valid array.
      setHeld({ stepId, index });
      setAnnouncement(
        t("holding", { value: shown(row[index]), step: stepLabel(step, stepIndex) }),
      );
      return;
    }

    const next = [...row];
    const a = held.index;
    const b = index;
    const valueA = next[a];
    const valueB = next[b];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(withRow(data, answer, stepIndex, next));
    setHeld(null);
    setAnnouncement(
      t("swapped", { a: shown(valueA), b: shown(valueB), step: stepLabel(step, stepIndex) }),
    );
  };

  const onCellKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    stepId: string,
    index: number,
    stepIndex: number,
  ) => {
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
    if (!horizontal && !vertical) return;
    event.preventDefault();

    if (horizontal) {
      const row = carryForward(data, answer, stepIndex);
      const target = index + (event.key === "ArrowLeft" ? -1 : 1);
      if (target < 0 || target >= row.length) return;
      focusCell(stepId, target);
      return;
    }

    const targetStepIndex = stepIndex + (event.key === "ArrowUp" ? -1 : 1);
    const targetStep = data.steps[targetStepIndex];
    if (!targetStep) return;
    const targetRow = carryForward(data, answer, targetStepIndex);
    focusCell(targetStep.id, Math.min(index, Math.max(targetRow.length - 1, 0)));
  };

  const setCell = (stepIndex: number, cellIndex: number, value: string) => {
    if (readonly) return;
    const row = [...displayRow(data, answer, stepIndex)];
    row[cellIndex] = value;
    onChange(withRow(data, answer, stepIndex, row));
  };

  return (
    <div className="bitflow-array-steps">
      <p className="bitflow-hint">
        {readonly
          ? t("howToReadonly")
          : t(data.mode === "write" ? "howToWrite" : "howToRearrange")}
      </p>

      <InitialRow data={data} locale={locale} />

      {data.steps.map((step, stepIndex) => {
        const state = states?.[stepIndex];
        const label = stepLabel(step, stepIndex);

        return (
          <div key={step.id} className="bitflow-array-block">
            <div className="bitflow-array-step-header">
              <span className="bitflow-label">{label}</span>
              {marked && (
                <span
                  className={`bitflow-state bitflow-state-${state!.state}`}
                >
                  {t(state!.state)}
                </span>
              )}
            </div>

            {data.mode === "rearrange" ? (
              <Cells
                values={carryForward(data, answer, stepIndex)}
                showIndices={data.showIndices}
                render={(value, index) => {
                  const isHeld = held?.stepId === step.id && held.index === index;
                  const wrong = marked && state!.diffs[index];
                  const classes = ["bitflow-array-cell", "bitflow-array-cell-button"];
                  if (isHeld) classes.push("bitflow-array-cell-held");
                  if (marked) {
                    classes.push(
                      wrong ? "bitflow-array-cell-wrong" : "bitflow-array-cell-correct",
                    );
                  }
                  return (
                    <button
                      type="button"
                      ref={(node) => {
                        const key = `${step.id}:${index}`;
                        if (node) cellsRef.current.set(key, node);
                        else cellsRef.current.delete(key);
                      }}
                      className={classes.join(" ")}
                      disabled={readonly}
                      aria-pressed={isHeld}
                      aria-label={t("cellLabel", {
                        value: shown(value),
                        position: index + 1,
                        total: data.initial.length,
                        step: label,
                      })}
                      onClick={() => pick(step.id, index, step, stepIndex)}
                      onKeyDown={(event) =>
                        onCellKeyDown(event, step.id, index, stepIndex)
                      }
                    >
                      {value}
                      {marked && (
                        <span className="bitflow-visually-hidden">
                          {" "}
                          {t(wrong ? "wrong" : "correct")}
                        </span>
                      )}
                    </button>
                  );
                }}
              />
            ) : (
              <Cells
                values={displayRow(data, answer, stepIndex)}
                showIndices={data.showIndices}
                render={(value, index) => {
                  const wrong = marked && state!.diffs[index];
                  const classes = ["bitflow-array-cell", "bitflow-array-cell-input"];
                  if (marked) {
                    classes.push(
                      wrong ? "bitflow-array-cell-wrong" : "bitflow-array-cell-correct",
                    );
                  }
                  return (
                    <input
                      type="text"
                      className={classes.join(" ")}
                      value={value}
                      disabled={readonly}
                      aria-label={t("cellInputLabel", {
                        position: index + 1,
                        total: slotCountOf(data),
                        step: label,
                      })}
                      // The array is being copied down by hand, not composed
                      // as prose — leave capitalisation and spelling exactly
                      // as typed.
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(event) => setCell(stepIndex, index, event.target.value)}
                    />
                  );
                }}
              />
            )}
          </div>
        );
      })}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
