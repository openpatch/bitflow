import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import { PbmError, parsePbm } from "./pbm";
import { PixelGrid } from "./PixelGrid";
import {
  DEFAULT_PALETTE,
  effectiveCells,
  resizeGrid,
  type Answer,
  type Data,
  type PaletteEntry,
} from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const wrong = (result?.detail as { wrong?: boolean[][] } | undefined)?.wrong;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <PixelGrid
        data={data}
        cells={effectiveCells(data, answer?.cells)}
        given={data.given}
        wrong={wrong}
        locale={locale}
        readonly={readonly}
        onChange={(cells) => onAnswerChange({ cells })}
      />
    </div>
  );
};

/** The grid limits, the same as the schema's, so a field cannot ask for a size
 *  the document would then refuse. */
const MIN_SIZE = 1;
const MAX_SIZE = 32;

const clampSize = (value: number): number =>
  Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)));

/** A palette id nobody has used yet, so a new colour never takes over the
 *  cells of one that was removed. */
const newColorId = (palette: PaletteEntry[]): string => {
  for (let n = palette.length + 1; ; n++) {
    const id = `color-${n}`;
    if (!palette.some((entry) => entry.id === id)) return id;
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

  const [markingGiven, setMarkingGiven] = useState(false);
  const [pbm, setPbm] = useState("");
  const [pbmError, setPbmError] = useState<string | undefined>(undefined);

  /** The target as the grid shows it: always the full size, so an author who
   *  has just made the grid bigger can paint the new cells straight away. */
  const target = resizeGrid(data.target, data.rows, data.columns, data.startColor);

  /**
   * A new size keeps the picture and the locks inside it. Both are resized
   * together, so a lock never survives outside the picture it belonged to.
   */
  const resize = (rows: number, columns: number) =>
    patch({
      rows,
      columns,
      target: resizeGrid(data.target, rows, columns, data.startColor),
      given:
        data.given.length > 0 ? resizeGrid(data.given, rows, columns, false) : [],
    });

  const setEntry = (id: string, changes: Partial<PaletteEntry>) =>
    patch({
      palette: data.palette.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    });

  /**
   * Removing a colour repaints its cells with the first colour left, rather
   * than leaving the picture pointing at an id nothing in the palette knows.
   */
  const removeEntry = (id: string) => {
    const palette = data.palette.filter((entry) => entry.id !== id);
    const fallback = palette[0]?.id ?? "";
    patch({
      palette,
      target: data.target.map((row) => row.map((cell) => (cell === id ? fallback : cell))),
      startColor: data.startColor === id ? fallback : data.startColor,
    });
  };

  const toggleGiven = (row: number, column: number) => {
    const given =
      data.given.length > 0
        ? resizeGrid(data.given, data.rows, data.columns, false)
        : resizeGrid([], data.rows, data.columns, false);
    given[row] = [...given[row]];
    given[row][column] = !given[row][column];
    // Nothing locked is stored as nothing at all, the same as a task that
    // never had a lock.
    patch({ given: given.some((line) => line.includes(true)) ? given : [] });
  };

  const importPbm = () => {
    try {
      const parsed = parsePbm(pbm);
      setPbmError(undefined);
      patch({
        rows: parsed.rows,
        columns: parsed.columns,
        palette: DEFAULT_PALETTE.map((entry) => ({ ...entry })),
        target: parsed.cells,
        given: [],
        startColor: DEFAULT_PALETTE[0].id,
      });
    } catch (error) {
      setPbmError(
        error instanceof PbmError ? t(error.key, error.vars) : String(error),
      );
    }
  };

  const sizeField = (
    label: string,
    value: number,
    set: (value: number) => void,
  ) => (
    <Field label={label}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input bitflow-pixelgrid-size"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next > 0) set(clampSize(next));
          }}
        />
      )}
    </Field>
  );

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("sizeLabel")}</legend>
        <span className="bitflow-hint">{t("sizeHint")}</span>
        <div className="bitflow-row">
          {sizeField(t("rowsLabel"), data.rows, (rows) => resize(rows, data.columns))}
          {sizeField(t("columnsLabel"), data.columns, (columns) =>
            resize(data.rows, columns),
          )}
        </div>
      </fieldset>

      <Disclosure summary={t("importSummary")}>
        <div className="bitflow-stack-small bitflow-stack">
          <TextAreaField
            label={t("importTextareaLabel")}
            hint={t("importHint")}
            rows={6}
            value={pbm}
            error={pbmError}
            onChange={setPbm}
          />
          <div className="bitflow-row">
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={importPbm}
            >
              {t("importButton")}
            </button>
          </div>
        </div>
      </Disclosure>

      {/* One compact line per colour — a swatch, what it means, and a way to
          remove it. Two fields do not earn a panel each. */}
      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("paletteLabel")}</legend>
        <span className="bitflow-hint">{t("paletteHint")}</span>
        {errorAt(errors, "palette") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "palette")}
          </span>
        )}
        {data.palette.map((entry, index) => (
          <div key={entry.id} className="bitflow-pixelgrid-palette-row">
            <input
              type="color"
              className="bitflow-pixelgrid-color-input"
              value={entry.color}
              aria-label={t("colorSwatchOf", { position: index + 1 })}
              onChange={(event) => setEntry(entry.id, { color: event.target.value })}
            />
            <input
              type="text"
              className="bitflow-input"
              value={entry.label}
              placeholder={t("colorLabelPlaceholder")}
              aria-label={t("colorLabelOf", { position: index + 1 })}
              onChange={(event) => setEntry(entry.id, { label: event.target.value })}
            />
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              disabled={data.palette.length <= 1}
              aria-label={t("removeColorOf", { position: index + 1 })}
              onClick={() => removeEntry(entry.id)}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                palette: [
                  ...data.palette,
                  { id: newColorId(data.palette), color: "#808080", label: "" },
                ],
              })
            }
          >
            {t("addColor")}
          </button>
        </div>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("targetLabel")}</legend>
        <span className="bitflow-hint">{t("targetHint")}</span>
        {errorFor(errors, "target") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "target")}
          </span>
        )}
        <CheckboxField
          label={t("markGivenLabel")}
          hint={t("markGivenHint")}
          checked={markingGiven}
          onChange={setMarkingGiven}
        />
        <PixelGrid
          data={data}
          cells={target}
          given={data.given}
          locale={locale}
          lockGiven={false}
          toggleGiven={markingGiven}
          onToggleGiven={toggleGiven}
          hint={markingGiven ? t("markGivenHowTo") : undefined}
          onChange={(cells) => patch({ target: cells })}
        />
      </fieldset>

      <SelectField
        label={t("startColorLabel")}
        hint={t("startColorHint")}
        value={data.startColor}
        error={errorFor(errors, "startColor")}
        options={data.palette.map((entry, index) => ({
          value: entry.id,
          label: entry.label || t("unnamedColor", { number: index + 1 }),
        }))}
        onChange={(startColor) => patch({ startColor })}
      />

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("showCoordinatesLabel")}
          hint={t("showCoordinatesHint")}
          checked={data.showCoordinates}
          onChange={(showCoordinates) => patch({ showCoordinates })}
        />
        <CheckboxField
          label={t("showLabelsLabel")}
          hint={t("showLabelsHint")}
          checked={data.showLabels}
          onChange={(showLabels) => patch({ showLabels })}
        />
        <CheckboxField
          label={t("partialCreditLabel")}
          hint={t("partialCreditHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
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
