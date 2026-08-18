import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  ImageField,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import type { Box } from "./geometry";
import { HotspotCanvas } from "./HotspotCanvas";
import { Picture } from "./Picture";
import type { Answer, Data, Hotspot } from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const detail = result?.detail as
    | { hotspotId?: string; missed?: boolean; feedback?: string }
    | undefined;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <Picture
        data={data}
        answer={answer}
        chosen={detail}
        locale={locale}
        readonly={readonly}
        onAnswerChange={onAnswerChange}
      />
      {/* The author's own word about the spot that was chosen. On a wrong
          region this is the whole point of the task. */}
      {detail?.feedback && (
        <p className="bitflow-hotspots-feedback">{detail.feedback}</p>
      )}
    </div>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `hotspot-${n}`;
    if (!taken.includes(id)) return id;
  }
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  const setOpen = (id: string, open: boolean) =>
    setOpened((current) => ({ ...current, [id]: open }));
  const select = (id: string | undefined) => {
    setSelectedId(id);
    if (id) setOpen(id, true);
  };

  const setHotspot = (id: string, changes: Partial<Hotspot>) =>
    patch({
      hotspots: data.hotspots.map((hotspot) =>
        hotspot.id === id ? { ...hotspot, ...changes } : hotspot,
      ),
    });

  const add = (box: Box, shape: Hotspot["shape"]) => {
    const id = newId(data.hotspots.map((hotspot) => hotspot.id));
    patch({
      hotspots: [
        ...data.hotspots,
        {
          id,
          shape,
          ...box,
          // The first region drawn is almost always the answer; later ones are
          // usually the wrong ones worth catching.
          correct: data.hotspots.length === 0,
          label: "",
        },
      ],
    });
    select(id);
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

      <ImageField
        value={data.background}
        locale={locale}
        label={t("backgroundLabel")}
        error={errorFor(errors, "background.src")}
        altError={errorFor(errors, "background.alt")}
        onChange={(background) => patch({ background })}
      />

      <HotspotCanvas
        data={data}
        locale={locale}
        selectedId={selectedId}
        onSelect={select}
        onDraw={(box) => add(box, "rect")}
        onMove={(id, box) => setHotspot(id, box)}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("regionsLabel")}</legend>
        <span className="bitflow-hint">{t("regionsHint")}</span>
        {errorFor(errors, "hotspots") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "hotspots")}
          </span>
        )}
        {data.hotspots.length === 0 && (
          <p className="bitflow-text-muted">{t("noRegions")}</p>
        )}

        {data.hotspots.map((hotspot, index) => (
          <div
            key={hotspot.id}
            className={
              selectedId === hotspot.id
                ? "bitflow-rule bitflow-rule-selected"
                : "bitflow-rule"
            }
          >
            <Disclosure
              summary={hotspot.label || t("unnamedRegion")}
              aside={t(hotspot.correct ? "isCorrect" : "isDecoy")}
              open={opened[hotspot.id] ?? false}
              onOpenChange={(open) => setOpen(hotspot.id, open)}
            >
              <TextField
                label={t("regionName")}
                hint={t("regionNameHint")}
                placeholder={t("regionNamePlaceholder")}
                value={hotspot.label}
                error={errorFor(errors, `hotspots.${index}.label`)}
                onChange={(label) => setHotspot(hotspot.id, { label })}
              />

              <CheckboxField
                label={t("regionCorrect")}
                checked={hotspot.correct}
                onChange={(correct) => setHotspot(hotspot.id, { correct })}
              />

              <SelectField
                label={t("regionShape")}
                value={hotspot.shape}
                options={[
                  { value: "rect" as const, label: t("shapeRect") },
                  { value: "ellipse" as const, label: t("shapeEllipse") },
                ]}
                onChange={(shape) => setHotspot(hotspot.id, { shape })}
              />

              <div className="bitflow-row">
                {(
                  [
                    ["x", "left"],
                    ["y", "top"],
                    ["width", "width"],
                    ["height", "height"],
                  ] as const
                ).map(([side, label]) => (
                  <Field key={side} label={t(label)}>
                    {(props) => (
                      <input
                        {...props}
                        type="number"
                        className="bitflow-input"
                        min={0}
                        max={1}
                        step={0.01}
                        value={hotspot[side]}
                        onChange={(event) =>
                          setHotspot(hotspot.id, {
                            [side]: Math.min(
                              1,
                              Math.max(0, Number(event.target.value) || 0),
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
              {errorFor(errors, `hotspots.${index}`) && (
                <span className="bitflow-field-error" role="alert">
                  {errorFor(errors, `hotspots.${index}`)}
                </span>
              )}

              <TextAreaField
                label={t("regionFeedback")}
                hint={t("regionFeedbackHint")}
                rows={2}
                value={hotspot.feedback ?? ""}
                onChange={(feedback) =>
                  setHotspot(hotspot.id, { feedback: feedback || undefined })
                }
              />

              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() =>
                  patch({
                    hotspots: data.hotspots.filter(
                      (other) => other.id !== hotspot.id,
                    ),
                  })
                }
              >
                {t("remove")}
              </button>
            </Disclosure>
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add({ x: 0.4, y: 0.4, width: 0.2, height: 0.2 }, "rect")}
          >
            {t("addRect")}
          </button>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              add({ x: 0.4, y: 0.4, width: 0.2, height: 0.2 }, "ellipse")
            }
          >
            {t("addEllipse")}
          </button>
        </div>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <TextAreaField
          label={t("missFeedback")}
          rows={2}
          value={data.missFeedback ?? ""}
          onChange={(missFeedback) =>
            patch({ missFeedback: missFeedback || undefined })
          }
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
