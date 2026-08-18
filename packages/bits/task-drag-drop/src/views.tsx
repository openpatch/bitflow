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
import type { ReactElement } from "react";
import { Board } from "./Board";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import type { Answer, Data, Item, Zone, ZoneState } from "./schema";

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
    <Board
      data={data}
      placements={answer?.placements ?? []}
      states={result?.detail?.zones as Record<string, ZoneState> | undefined}
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

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const setItem = (id: string, changes: Partial<Item>) =>
    patch({
      items: data.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    });

  const setZone = (id: string, changes: Partial<Zone>) =>
    patch({
      zones: data.zones.map((zone) =>
        zone.id === id ? { ...zone, ...changes } : zone,
      ),
    });

  const removeItem = (id: string) =>
    patch({
      items: data.items.filter((item) => item.id !== id),
      // A deleted label must not stay listed as belonging somewhere, or the
      // region silently becomes impossible to fill correctly.
      zones: data.zones.map((zone) => ({
        ...zone,
        acceptedItemIds: zone.acceptedItemIds.filter((itemId) => itemId !== id),
      })),
    });

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

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("itemsLabel")}</legend>
        <span className="bitflow-hint">{t("itemsHint")}</span>
        {errorFor(errors, "items") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "items")}
          </span>
        )}

        {data.items.map((item) => (
          <div key={item.id} className="bitflow-row">
            <input
              type="text"
              className="bitflow-input"
              aria-label={t("itemPlaceholder")}
              placeholder={t("itemPlaceholder")}
              value={item.label}
              onChange={(event) => setItem(item.id, { label: event.target.value })}
            />
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              aria-label={`${t("removeItem")} ${item.label || item.id}`}
              onClick={() => removeItem(item.id)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() =>
            patch({
              items: [
                ...data.items,
                {
                  id: newId("item", data.items.map((item) => item.id)),
                  kind: "text",
                  label: "",
                },
              ],
            })
          }
        >
          {t("addItem")}
        </button>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("zonesLabel")}</legend>
        <span className="bitflow-hint">{t("zonesHint")}</span>
        {errorFor(errors, "zones") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "zones")}
          </span>
        )}

        {data.zones.length === 0 && (
          <p className="bitflow-text-muted">{t("noZones")}</p>
        )}

        {data.zones.map((zone, index) => (
          <div key={zone.id} className="bitflow-rule">
            <TextField
              label={t("zoneName")}
              value={zone.label}
              placeholder={t("zoneNamePlaceholder")}
              error={errorFor(errors, `zones.${index}.label`)}
              onChange={(label) => setZone(zone.id, { label })}
            />

            <div className="bitflow-row">
              {(["x", "y", "width", "height"] as const).map((side) => (
                <Field
                  key={side}
                  label={t(
                    side === "x"
                      ? "zoneLeft"
                      : side === "y"
                        ? "zoneTop"
                        : side === "width"
                          ? "zoneWidth"
                          : "zoneHeight",
                  )}
                >
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      className="bitflow-input"
                      min={0}
                      max={1}
                      step={0.01}
                      value={zone.rect[side]}
                      onChange={(event) =>
                        setZone(zone.id, {
                          rect: {
                            ...zone.rect,
                            [side]: Math.min(
                              1,
                              Math.max(0, Number(event.target.value) || 0),
                            ),
                          },
                        })
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
            {errorFor(errors, `zones.${index}.rect`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `zones.${index}.rect`)}
              </span>
            )}

            <fieldset className="bitflow-field">
              <legend className="bitflow-label">{t("zoneAccepts")}</legend>
              {data.items.map((item) => (
                <label key={item.id} className="bitflow-option">
                  <input
                    type="checkbox"
                    checked={zone.acceptedItemIds.includes(item.id)}
                    onChange={(event) =>
                      setZone(zone.id, {
                        acceptedItemIds: event.target.checked
                          ? [...zone.acceptedItemIds, item.id]
                          : zone.acceptedItemIds.filter((id) => id !== item.id),
                      })
                    }
                  />
                  <span>{item.label || item.id}</span>
                </label>
              ))}
            </fieldset>

            <Field label={t("zoneScore")}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  className="bitflow-input"
                  min={0}
                  step={0.5}
                  value={zone.score}
                  onChange={(event) =>
                    setZone(zone.id, {
                      score: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              )}
            </Field>

            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() =>
                patch({ zones: data.zones.filter((other) => other.id !== zone.id) })
              }
            >
              {t("removeZone")}
            </button>
          </div>
        ))}

        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() =>
            patch({
              zones: [
                ...data.zones,
                {
                  id: newId("zone", data.zones.map((zone) => zone.id)),
                  label: "",
                  // Somewhere visible and roomy enough to click, rather than a
                  // zero-sized region in the corner.
                  rect: { x: 0.4, y: 0.4, width: 0.2, height: 0.15 },
                  acceptedItemIds: [],
                  score: 1,
                },
              ],
            })
          }
        >
          {t("addZone")}
        </button>
      </fieldset>

      {/* The board as the learner meets it, so the author can see whether the
          regions actually land on the picture. */}
      <Board
        data={data}
        placements={[]}
        locale={locale}
        readonly
        onChange={() => {}}
      />

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("allowMultipleLabel")}
          hint={t("allowMultipleHint")}
          checked={data.allowMultiplePlacements}
          onChange={(allowMultiplePlacements) => patch({ allowMultiplePlacements })}
        />
        <CheckboxField
          label={t("partialCreditLabel")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
        />
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>

      <span className="bitflow-visually-hidden">
        {translate(messages, "name", locale)}
      </span>
    </div>
  );
};
