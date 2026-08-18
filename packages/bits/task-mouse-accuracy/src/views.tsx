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
  usePointerDrag,
} from "@bitflow/element";
import {
  useReducer,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { Arena } from "./Arena";
import type { RoundOutcome } from "./evaluate";
import { formMessages } from "./formMessages";
import type { Answer, Data, Target } from "./schema";

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
    <Arena
      data={data}
      answer={{ rounds: answer?.rounds ?? [], optedOut: answer?.optedOut ?? false }}
      outcomes={result?.detail?.rounds as RoundOutcome[] | undefined}
      locale={locale}
      readonly={readonly}
      onChange={onAnswerChange}
    />
  </div>
);

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `target-${n}`;
    if (!taken.includes(id)) return id;
  }
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

  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; moved: boolean; fromX: number; fromY: number } | null>(
    null,
  );
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  /** A point in the area, as the fractions the targets are stored in. */
  const fractionsAt = (clientX: number, clientY: number) => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return undefined;
    return {
      x: Math.min(1, Math.max(0, (clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (clientY - box.top) / box.height)),
    };
  };

  const setTarget = (id: string, changes: Partial<Target>) =>
    patch({
      targets: data.targets.map((target) =>
        target.id === id ? { ...target, ...changes } : target,
      ),
    });

  const startDrag = (event: ReactPointerEvent, id: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    dragRef.current = { id, moved: false, fromX: event.clientX, fromY: event.clientY };
    redraw();
  };

  const moveDrag = (event: PointerEvent | ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const at = fractionsAt(event.clientX, event.clientY);
    if (!at) return;
    dragRef.current = {
      ...drag,
      // Measured from where the drag began, so a slow drag still counts as
      // one and does not end as a click that adds another target.
      moved:
        drag.moved ||
        Math.abs(event.clientX - drag.fromX) > 3 ||
        Math.abs(event.clientY - drag.fromY) > 3,
    };
    setTarget(drag.id, at);
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    redraw();
    if (drag?.moved) placed.current = true;
  };

  /** Set by a drag, and cleared by the click that follows it. */
  const placed = useRef(false);

  usePointerDrag(moveDrag, endDrag);

  const addAt = (event: { clientX: number; clientY: number }) => {
    if (placed.current) {
      placed.current = false;
      return;
    }
    const at = fractionsAt(event.clientX, event.clientY);
    if (!at) return;
    patch({
      targets: [
        ...data.targets,
        {
          id: newId(data.targets.map((target) => target.id)),
          ...at,
          radius: 0.06,
        },
      ],
    });
  };

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("targetsLabel")}</legend>
        <span className="bitflow-hint">{t("targetsHint")}</span>
        {errorFor(errors, "targets") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "targets")}
          </span>
        )}

        <div
          ref={areaRef}
          className="bitflow-mouse-area bitflow-mouse-area-editing"
          style={{ aspectRatio: `1 / ${data.aspectRatio}` }}
          onClick={addAt}
        >
          {data.targets.map((target, index) => (
            <span
              key={target.id}
              className="bitflow-mouse-target bitflow-mouse-target-editing"
              style={{
                left: `${target.x * 100}%`,
                top: `${target.y * 100}%`,
                width: `${target.radius * Math.min(1, data.aspectRatio) * 200}%`,
                aspectRatio: "1",
              }}
              onPointerDown={(event) => startDrag(event, target.id)}
            >
              {index + 1}
            </span>
          ))}
        </div>

        {data.targets.length === 0 ? (
          <p className="bitflow-text-muted">{t("noTargets")}</p>
        ) : (
          data.targets.map((target, index) => (
            <div key={target.id} className="bitflow-rule">
              <Disclosure
                summary={t("targetAt", {
                  number: index + 1,
                  x: Math.round(target.x * 100),
                  y: Math.round(target.y * 100),
                  size: Math.round(target.radius * 200),
                })}
              >
                <Field label={t("radiusLabel")}>
                  {(props) => (
                    <input
                      {...props}
                      type="range"
                      className="bitflow-input"
                      min={1}
                      max={25}
                      step={1}
                      value={Math.round(target.radius * 100)}
                      onChange={(event) =>
                        setTarget(target.id, {
                          radius: Number(event.target.value) / 100,
                        })
                      }
                    />
                  )}
                </Field>
                <div className="bitflow-row">
                  <button
                    type="button"
                    className="bitflow-button bitflow-button-quiet"
                    onClick={() =>
                      patch({
                        targets: data.targets.filter((other) => other.id !== target.id),
                      })
                    }
                  >
                    {t("remove")}
                  </button>
                </div>
              </Disclosure>
            </div>
          ))
        )}
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <Field label={t("aspectLabel")} hint={t("aspectHint")}>
          {(props) => (
            <input
              {...props}
              type="range"
              className="bitflow-input"
              min={20}
              max={150}
              step={5}
              value={Math.round(data.aspectRatio * 100)}
              onChange={(event) =>
                patch({ aspectRatio: Number(event.target.value) / 100 })
              }
            />
          )}
        </Field>

        <SelectField
          label={t("scoringLabel")}
          hint={t("scoringHint")}
          value={data.scoring}
          options={[
            { value: "hits" as const, label: t("scoringHits") },
            { value: "hitsAndSpeed" as const, label: t("scoringHitsAndSpeed") },
          ]}
          onChange={(scoring) => patch({ scoring })}
        />

        {data.scoring === "hitsAndSpeed" && (
          <Field label={t("allowanceLabel")} hint={t("allowanceHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={200}
                max={30000}
                step={100}
                value={data.allowanceMs}
                onChange={(event) =>
                  patch({
                    allowanceMs: Math.min(
                      30000,
                      Math.max(200, Math.round(Number(event.target.value) || 200)),
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
