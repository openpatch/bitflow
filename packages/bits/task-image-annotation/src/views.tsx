import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  ImageField,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
  usePanels,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import { Canvas } from "./Canvas";
import { formMessages } from "./formMessages";
import { RegionCanvas, regionFrom } from "./RegionCanvas";
import {
  ANNOTATION_KINDS,
  type Annotation,
  type Answer,
  type AnnotationKind,
  type Data,
  type Region,
  type RegionOutcome,
} from "./schema";

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
    <Canvas
      data={data}
      answer={answer}
      outcomes={result?.detail?.regions as RegionOutcome[] | undefined}
      locale={locale}
      readonly={readonly}
      onAnswerChange={onAnswerChange}
    />
  </div>
);

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `region-${n}`;
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

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const panels = usePanels(data.regions.map((region) => region.id));

  const select = (id: string | undefined) => {
    setSelectedId(id);
    if (id) panels.open(id);
  };

  const setRegion = (id: string, changes: Partial<Region>) =>
    patch({
      regions: data.regions.map((region) =>
        region.id === id ? { ...region, ...changes } : region,
      ),
    });

  const add = (box: { x: number; y: number; width: number; height: number }) => {
    const id = newId(data.regions.map((region) => region.id));
    const region = regionFrom(id, box, data.annotationKind === "rect" ? "rect" : "circle");
    patch({
      regions: [...data.regions, region],
      // A task nobody can finish is not what the author just asked for, so
      // drawing a region raises the ceiling with it rather than reporting a
      // problem the next click would have avoided.
      maximumCount: Math.max(data.maximumCount, data.regions.length + 1),
    });
    select(id);
  };

  /** A percentage field over one of a region's fractions. */
  const percent = (
    region: Region,
    key: "x" | "y" | "width" | "height" | "radius",
    label: string,
  ) => (
    <Field label={label}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input"
          min={0}
          max={100}
          step={1}
          value={Math.round(region[key] * 100)}
          onChange={(event) =>
            setRegion(region.id, {
              [key]: Math.min(1, Math.max(0, Number(event.target.value) / 100)),
            })
          }
        />
      )}
    </Field>
  );

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
        label={t("imageLabel")}
        altLabel={t("altLabel")}
        altHint={t("altHint")}
        error={errorFor(errors, "background.src")}
        altError={errorFor(errors, "background.alt")}
        onChange={(background) => patch({ background })}
      />

      <SelectField
        label={t("kindLabel")}
        value={data.annotationKind}
        options={ANNOTATION_KINDS.map((kind) => ({
          value: kind as AnnotationKind,
          label: t(kind === "point" ? "kindPoint" : "kindRect"),
        }))}
        onChange={(annotationKind) => patch({ annotationKind })}
      />

      {/* Drawn on rather than typed at. The numbers below are the same numbers,
          for anyone without a pointer. */}
      <div className="bitflow-field">
        <span className="bitflow-hint">{t("previewHint")}</span>
        <RegionCanvas
          data={data}
          locale={locale}
          selectedId={selectedId}
          onSelect={select}
          onDraw={add}
          onMove={(id, at) => setRegion(id, at)}
        />
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("regionsLabel")}</legend>
        <span className="bitflow-hint">{t("regionsHint")}</span>
        {errorAt(errors, "regions") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "regions")}
          </span>
        )}
        {data.regions.length === 0 && (
          <p className="bitflow-text-muted">{t("noRegions")}</p>
        )}

        {data.regions.map((region, index) => (
          <div
            key={region.id}
            className={
              selectedId === region.id
                ? "bitflow-rule bitflow-rule-selected"
                : "bitflow-rule"
            }
          >
            <Disclosure
              {...panels.props(region.id)}
              summary={region.label || t("unnamedRegion")}
            >
              <TextField
                label={t("regionName")}
                hint={t("regionNameHint")}
                placeholder={t("regionNamePlaceholder")}
                value={region.label}
                error={errorFor(errors, `regions.${index}.label`)}
                onChange={(label) => setRegion(region.id, { label })}
              />

              <SelectField
                label={t("regionShape")}
                value={region.kind}
                options={[
                  { value: "circle" as const, label: t("shapeCircle") },
                  { value: "rect" as const, label: t("shapeRect") },
                ]}
                onChange={(kind) => setRegion(region.id, { kind })}
              />

              <div className="bitflow-row">
                {percent(region, "x", t("regionX"))}
                {percent(region, "y", t("regionY"))}
              </div>
              {region.kind === "circle" ? (
                <>
                  {percent(region, "radius", t("regionRadius"))}
                  {errorFor(errors, `regions.${index}.radius`) && (
                    <span className="bitflow-field-error" role="alert">
                      {errorFor(errors, `regions.${index}.radius`)}
                    </span>
                  )}
                </>
              ) : (
                <div className="bitflow-row">
                  {percent(region, "width", t("regionWidth"))}
                  {percent(region, "height", t("regionHeight"))}
                </div>
              )}
              {errorFor(errors, `regions.${index}`) && (
                <span className="bitflow-field-error" role="alert">
                  {errorFor(errors, `regions.${index}`)}
                </span>
              )}

              {data.requireLabel && (
                <TextAreaField
                  label={t("acceptedLabels")}
                  hint={t("acceptedLabelsHint")}
                  rows={2}
                  value={region.acceptedLabels.join("\n")}
                  onChange={(value) =>
                    setRegion(region.id, {
                      acceptedLabels: value
                        .split("\n")
                        .map((name) => name.trim())
                        .filter(Boolean),
                    })
                  }
                />
              )}

              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() =>
                    patch({
                      regions: data.regions.filter(
                        (other) => other.id !== region.id,
                      ),
                    })
                  }
                >
                  {t("removeRegion")}
                </button>
              </div>
            </Disclosure>
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add({ x: 0.4, y: 0.4, width: 0.2, height: 0.2 })}
          >
            {t("addRegion")}
          </button>
        </div>
      </fieldset>

      <CheckboxField
        label={t("requireLabelLabel")}
        hint={t("requireLabelHint")}
        checked={data.requireLabel}
        onChange={(requireLabel) => patch({ requireLabel })}
      />

      <Disclosure summary={t("advanced")}>
        <Field
          label={t("countLabel")}
          hint={t("countHint")}
          error={errorFor(errors, "maximumCount")}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              className="bitflow-input"
              min={1}
              step={1}
              value={data.maximumCount}
              onChange={(event) =>
                patch({
                  maximumCount: Math.max(1, Math.round(Number(event.target.value) || 1)),
                })
              }
            />
          )}
        </Field>

        {data.annotationKind === "rect" && (
          <Field label={t("overlapLabel")} hint={t("overlapHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={0}
                max={100}
                step={5}
                value={Math.round(data.overlap * 100)}
                onChange={(event) =>
                  patch({
                    overlap: Math.min(
                      1,
                      Math.max(0, Number(event.target.value) / 100),
                    ),
                  })
                }
              />
            )}
          </Field>
        )}

        <CheckboxField
          label={t("penaliseLabel")}
          hint={t("penaliseHint")}
          checked={data.penaliseExtras}
          onChange={(penaliseExtras) => patch({ penaliseExtras })}
        />

        {data.requireLabel && (
          <CheckboxField
            label={t("caseSensitiveLabel")}
            checked={data.caseSensitive}
            onChange={(caseSensitive) => patch({ caseSensitive })}
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

export type { Annotation };
