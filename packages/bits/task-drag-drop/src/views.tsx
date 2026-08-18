import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import { DragCanvas } from "./DragCanvas";
import { EditorCanvas } from "./EditorCanvas";
import { formMessages } from "./formMessages";
import type { Judged } from "./evaluate";
import type { Box } from "./layout";
import type { Answer, Data, DropZone, Element } from "./schema";

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
    <DragCanvas
      data={data}
      placements={answer?.placements ?? []}
      judged={result?.detail?.placements as Judged[] | undefined}
      locale={locale}
      readonly={readonly}
      onChange={(placements) => onAnswerChange({ placements })}
    />
  </div>
);

/** A fresh id that will not collide with one the author already used. */
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** The four fractions every box on the play area is positioned by. */
const BoxFields = ({
  box,
  t,
  onChange,
}: {
  box: { x: number; y: number; width: number; height: number };
  t: (key: string) => string;
  onChange: (side: "x" | "y" | "width" | "height", value: number) => void;
}) => (
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
            value={box[side]}
            onChange={(event) =>
              onChange(side, Math.min(1, Math.max(0, Number(event.target.value) || 0)))
            }
          />
        )}
      </Field>
    ))}
  </div>
);

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  /** What the canvas has selected, so its fields can be highlighted. */
  const [selected, setSelected] = useState<
    { type: "zone" | "element"; id: string } | undefined
  >();

  const setElement = (id: string, changes: Partial<Element>) =>
    patch({
      elements: data.elements.map((element) =>
        element.id === id ? { ...element, ...changes } : element,
      ),
    });

  const setZone = (id: string, changes: Partial<DropZone>) =>
    patch({
      dropZones: data.dropZones.map((zone) =>
        zone.id === id ? { ...zone, ...changes } : zone,
      ),
    });

  const removeElement = (id: string) =>
    patch({
      elements: data.elements.filter((element) => element.id !== id),
      // A deleted element must not stay listed as belonging somewhere, or the
      // zone quietly becomes impossible to fill correctly.
      dropZones: data.dropZones.map((zone) => ({
        ...zone,
        correctElementIds: zone.correctElementIds.filter((other) => other !== id),
      })),
    });

  const removeZone = (id: string) =>
    patch({ dropZones: data.dropZones.filter((zone) => zone.id !== id) });

  const toggle = (list: string[], id: string, on: boolean) =>
    on ? [...list, id] : list.filter((other) => other !== id);

  /** Adds a zone where it was drawn, and opens it for naming. */
  const addZoneAt = (box: Box) => {
    const id = newId("zone", data.dropZones.map((zone) => zone.id));
    patch({
      dropZones: [
        ...data.dropZones,
        {
          id,
          label: "",
          ...box,
          correctElementIds: [],
          backgroundOpacity: 100,
        },
      ],
    });
    setSelected({ type: "zone", id });
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

      <TextField
        label={t("imageLabel")}
        hint={t("imageHint")}
        value={data.background.src}
        onChange={(src) => patch({ background: { ...data.background, src } })}
      />
      <TextAreaField
        label={t("altLabel")}
        hint={t("altHint")}
        rows={2}
        value={data.background.alt}
        error={errorFor(errors, "background.alt")}
        onChange={(alt) => patch({ background: { ...data.background, alt } })}
      />

      {/* Drawn on rather than typed at: drag on the background to make a drop
          zone, drag a box to move it, drag its corner to resize. The numeric
          fields below stay for anyone without a pointer. */}
      <EditorCanvas
        data={data}
        locale={locale}
        selected={selected}
        onSelect={setSelected}
        onAddZone={addZoneAt}
        onMoveZone={(id, box) => setZone(id, box)}
        onMoveElement={(id, box) => setElement(id, box)}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("zonesLabel")}</legend>
        <span className="bitflow-hint">{t("zonesHint")}</span>
        {errorFor(errors, "dropZones") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "dropZones")}
          </span>
        )}
        {data.dropZones.length === 0 && (
          <p className="bitflow-text-muted">{t("noZones")}</p>
        )}

        {data.dropZones.map((zone, index) => (
          <div
            key={zone.id}
            className={
              selected?.type === "zone" && selected.id === zone.id
                ? "bitflow-rule bitflow-rule-selected"
                : "bitflow-rule"
            }
          >
            <TextField
              label={t("zoneName")}
              placeholder={t("zoneNamePlaceholder")}
              value={zone.label}
              error={errorFor(errors, `dropZones.${index}.label`)}
              onChange={(label) => setZone(zone.id, { label })}
            />
            <BoxFields
              box={zone}
              t={t}
              onChange={(side, value) => setZone(zone.id, { [side]: value })}
            />
            {errorFor(errors, `dropZones.${index}`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `dropZones.${index}`)}
              </span>
            )}

            <fieldset className="bitflow-field">
              <legend className="bitflow-label">{t("zoneExpects")}</legend>
              {data.elements.map((element) => (
                <label key={element.id} className="bitflow-option">
                  <input
                    type="checkbox"
                    checked={zone.correctElementIds.includes(element.id)}
                    onChange={(event) =>
                      setZone(zone.id, {
                        correctElementIds: toggle(
                          zone.correctElementIds,
                          element.id,
                          event.target.checked,
                        ),
                      })
                    }
                  />
                  <span>{element.label || element.id}</span>
                </label>
              ))}
            </fieldset>

            <TextField
              label={t("zoneTip")}
              value={zone.tip ?? ""}
              onChange={(tip) => setZone(zone.id, { tip: tip || undefined })}
            />
            <TextField
              label={t("zoneFeedbackCorrect")}
              value={zone.feedbackOnCorrect ?? ""}
              onChange={(text) =>
                setZone(zone.id, { feedbackOnCorrect: text || undefined })
              }
            />
            <TextField
              label={t("zoneFeedbackIncorrect")}
              value={zone.feedbackOnIncorrect ?? ""}
              onChange={(text) =>
                setZone(zone.id, { feedbackOnIncorrect: text || undefined })
              }
            />

            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => removeZone(zone.id)}
            >
              {t("remove")}
            </button>
          </div>
        ))}

        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() =>
            patch({
              dropZones: [
                ...data.dropZones,
                {
                  id: newId("zone", data.dropZones.map((zone) => zone.id)),
                  label: "",
                  x: 0.55,
                  y: 0.2,
                  width: 0.3,
                  height: 0.25,
                  correctElementIds: [],
                  backgroundOpacity: 100,
                },
              ],
            })
          }
        >
          {t("addZone")}
        </button>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("elementsLabel")}</legend>
        <span className="bitflow-hint">{t("elementsHint")}</span>
        {errorFor(errors, "elements") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "elements")}
          </span>
        )}
        {data.elements.length === 0 && (
          <p className="bitflow-text-muted">{t("noElements")}</p>
        )}

        {data.elements.map((element, index) => (
          <div
            key={element.id}
            className={
              selected?.type === "element" && selected.id === element.id
                ? "bitflow-rule bitflow-rule-selected"
                : "bitflow-rule"
            }
          >
            <TextField
              label={t("elementText")}
              value={element.label}
              error={errorFor(errors, `elements.${index}.label`)}
              onChange={(label) => setElement(element.id, { label })}
            />
            <BoxFields
              box={element}
              t={t}
              onChange={(side, value) => setElement(element.id, { [side]: value })}
            />
            {errorFor(errors, `elements.${index}`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `elements.${index}`)}
              </span>
            )}

            <CheckboxField
              label={t("elementMultiple")}
              hint={t("elementMultipleHint")}
              checked={element.multiple}
              onChange={(multiple) => setElement(element.id, { multiple })}
            />

            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => removeElement(element.id)}
            >
              {t("remove")}
            </button>
          </div>
        ))}

        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() =>
            patch({
              elements: [
                ...data.elements,
                {
                  id: newId("element", data.elements.map((element) => element.id)),
                  kind: "text" as const,
                  label: "",
                  x: 0.05,
                  y: 0.05 + data.elements.length * 0.14,
                  width: 0.25,
                  height: 0.12,
                  multiple: false,
                  backgroundOpacity: 100,
                },
              ],
            })
          }
        >
          {t("addElement")}
        </button>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <div className="bitflow-row">
          <Field label={t("sizeWidth")} hint={t("sizeHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={1}
                value={data.size.width}
                onChange={(event) =>
                  patch({
                    size: {
                      ...data.size,
                      width: Math.max(1, Number(event.target.value) || 1),
                    },
                  })
                }
              />
            )}
          </Field>
          <Field label={t("sizeHeight")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={1}
                value={data.size.height}
                onChange={(event) =>
                  patch({
                    size: {
                      ...data.size,
                      height: Math.max(1, Number(event.target.value) || 1),
                    },
                  })
                }
              />
            )}
          </Field>
        </div>

        <CheckboxField
          label={t("singlePointLabel")}
          hint={t("singlePointHint")}
          checked={data.singlePoint}
          onChange={(singlePoint) => patch({ singlePoint })}
        />
        <CheckboxField
          label={t("applyPenaltiesLabel")}
          hint={t("applyPenaltiesHint")}
          checked={data.applyPenalties}
          onChange={(applyPenalties) => patch({ applyPenalties })}
        />
        {errorFor(errors, "applyPenalties") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "applyPenalties")}
          </span>
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
