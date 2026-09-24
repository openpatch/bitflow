import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  TextAreaField,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import { knn, nearestCentroid } from "./classify";
import type { PointStates } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { PlotView } from "./PlotView";
import {
  centroids,
  classLabel,
  knownPoints,
  roleOf,
  SHAPES,
  type Answer,
  type Axis,
  type Class,
  type Data,
  type Point,
  type PointRole,
  type Shape,
} from "./schema";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const states = (result?.detail as { points?: PointStates } | undefined)?.points;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>
      <PlotView
        data={data}
        answer={answer}
        states={states}
        locale={locale}
        readonly={readonly}
        onAssign={(pointId, classId) => {
          const assignments = { ...answer?.assignments };
          if (classId === undefined) delete assignments[pointId];
          else assignments[pointId] = classId;
          onAnswerChange({ assignments });
        }}
      />
      <WrittenOut data={data} locale={locale} />
    </div>
  );
};

/**
 * Every point as a line of text. The diagram is one image to a screen reader,
 * and the list of open points under it says where the questions are but not
 * what they are measured against — the known points and the centres, which
 * are the whole of the information a nearest-neighbour answer is worked out
 * from.
 */
const WrittenOut = ({ data, locale }: { data: Data; locale: BitTaskProps<Data, Answer>["locale"] }) => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const name = (point: Point, index: number) =>
    point.label || t("unnamedPoint", { number: index + 1 });

  return (
    <details className="bitflow-point-plot-written">
      <summary>{t("writtenOut")}</summary>
      {data.axes.x.label && <p className="bitflow-text">{t("xAxisNote", { label: data.axes.x.label })}</p>}
      {data.axes.y.label && <p className="bitflow-text">{t("yAxisNote", { label: data.axes.y.label })}</p>}
      <ul>
        {data.points.map((point, index) => {
          const at = `(${point.x}, ${point.y})`;
          const role = roleOf(point);
          const text =
            role === "centroid"
              ? t("centroidTitle", { class: classLabel(data, point.class) })
              : role === "known"
                ? t("knownTitle", { label: name(point, index), class: classLabel(data, point.class) })
                : t("openUnassigned", { label: name(point, index) });
          return (
            <li key={point.id}>
              {text} {at}
            </li>
          );
        })}
      </ul>
    </details>
  );
};

/**
 * A number typed as text. Held as a draft while it is typed, since "-", "3."
 * and "" are all on the way to a number without being one, and a controlled
 * field that only accepted finished numbers would throw each of them away —
 * a negative coordinate could never be started. A comma works as the decimal
 * point too.
 */
const NumberInput = ({
  value,
  onChange,
  ...props
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}): ReactElement => {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="text"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const next = Number(event.target.value.replace(",", "."));
        if (event.target.value.trim() !== "" && Number.isFinite(next)) onChange(next);
      }}
    />
  );
};

/** A fresh id that will not collide with one already in use. */
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** Distinct by default, so two classes added in a row do not start identical. */
const STARTING_COLORS = ["#017460", "#a3282d", "#1f5673", "#8a6100", "#5a4b8a"];

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });
  const [k, setK] = useState(3);

  const setAxis = (which: "x" | "y", changes: Partial<Axis>) =>
    patch({ axes: { ...data.axes, [which]: { ...data.axes[which], ...changes } } });

  const setClass = (id: string, changes: Partial<Class>) =>
    patch({
      classes: data.classes.map((klass) => (klass.id === id ? { ...klass, ...changes } : klass)),
    });

  /** Removing a class clears it from every point, rather than leaving points
   *  pointing at a class that is gone. */
  const removeClass = (id: string) =>
    patch({
      classes: data.classes.filter((klass) => klass.id !== id),
      points: data.points.map((point) => ({
        ...point,
        class: point.class === id ? undefined : point.class,
        expected: point.expected === id ? undefined : point.expected,
      })),
    });

  const setPoint = (id: string, changes: Partial<Point>) =>
    patch({
      points: data.points.map((point) => (point.id === id ? { ...point, ...changes } : point)),
    });

  const firstClass = data.classes[0]?.id;

  /** A new point is a known one of the first class: the commonest kind, and
   *  one the form can always draw. */
  const addPoint = (x: number, y: number) =>
    patch({
      points: [
        ...data.points,
        {
          id: newId("p", data.points.map((point) => point.id)),
          x,
          y,
          class: firstClass,
          centroid: false,
        },
      ],
    });

  /**
   * A role is three fields at once — `centroid`, `class`, `expected` — so it is
   * set as one choice, carrying the class over to whichever field the new
   * role reads it from.
   */
  const setRole = (point: Point, role: PointRole) => {
    const klass = point.class ?? point.expected ?? firstClass;
    setPoint(
      point.id,
      role === "open"
        ? { centroid: false, class: undefined, expected: klass }
        : { centroid: role === "centroid", class: klass, expected: undefined },
    );
  };

  /** Class order is the documented tie-break, so the helpers are handed their
   *  candidates sorted by it. */
  const byClassOrder = (points: Point[]) => {
    const order = (point: Point) =>
      data.classes.findIndex((klass) => klass.id === point.class);
    return [...points].sort((a, b) => order(a) - order(b));
  };

  const fillBy = (pick: (point: Point) => string | undefined) =>
    patch({
      points: data.points.map((point) =>
        roleOf(point) === "open" ? { ...point, expected: pick(point) ?? point.expected } : point,
      ),
    });

  const shapeLabel: Record<Shape, string> = {
    circle: t("shapeCircle"),
    square: t("shapeSquare"),
    triangle: t("shapeTriangle"),
    diamond: t("shapeDiamond"),
  };

  const numberInput = (
    label: string,
    value: number,
    set: (value: number) => void,
    error?: string,
  ) => (
    <Field label={label} error={error}>
      {(props) => (
        <NumberInput
          {...props}
          className="bitflow-input bitflow-point-plot-number"
          value={value}
          onChange={set}
        />
      )}
    </Field>
  );

  const axisFields = (which: "x" | "y") => (
    <fieldset className="bitflow-field">
      <legend className="bitflow-label">{t(which === "x" ? "xAxisLegend" : "yAxisLegend")}</legend>
      <div className="bitflow-row">
        <Field label={t("axisLabelField")}>
          {(props) => (
            <input
              {...props}
              type="text"
              className="bitflow-input"
              value={data.axes[which].label}
              onChange={(event) => setAxis(which, { label: event.target.value })}
            />
          )}
        </Field>
        {numberInput(t("axisMinField"), data.axes[which].min, (min) => setAxis(which, { min }))}
        {numberInput(
          t("axisMaxField"),
          data.axes[which].max,
          (max) => setAxis(which, { max }),
          errorFor(errors, `axes.${which}.max`),
        )}
      </div>
    </fieldset>
  );

  const pointErrors = [
    ...new Set(
      (errors ?? [])
        .filter((diagnostic) => /^points\.\d+\./.test(diagnostic.path))
        .map((diagnostic) => diagnostic.message),
    ),
  ];

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={3}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      {axisFields("x")}
      {axisFields("y")}

      {/* A class is a name, a colour and a shape: one compact line each. */}
      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("classesLabel")}</legend>
        <span className="bitflow-hint">{t("classesHint")}</span>
        {errorAt(errors, "classes") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "classes")}
          </span>
        )}
        {data.classes.length === 0 && <p className="bitflow-text-muted">{t("noClasses")}</p>}
        {data.classes.map((klass, index) => {
          const name = klass.label || t("unnamedClass", { number: index + 1 });
          return (
            <div key={klass.id} className="bitflow-point-plot-editor-row">
              <input
                type="text"
                className="bitflow-input"
                value={klass.label}
                placeholder={t("classNamePlaceholder")}
                aria-label={t("classNameOf", { position: index + 1 })}
                aria-invalid={errorFor(errors, `classes.${index}.label`) ? true : undefined}
                onChange={(event) => setClass(klass.id, { label: event.target.value })}
              />
              <input
                type="color"
                className="bitflow-point-plot-color-input"
                value={klass.color}
                aria-label={t("classColorOf", { class: name })}
                onChange={(event) => setClass(klass.id, { color: event.target.value })}
              />
              <select
                className="bitflow-select"
                value={klass.shape}
                aria-label={t("classShapeOf", { class: name })}
                onChange={(event) => setClass(klass.id, { shape: event.target.value as Shape })}
              >
                {SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shapeLabel[shape]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removeClassOf", { class: name })}
                onClick={() => removeClass(klass.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => {
              const index = data.classes.length;
              patch({
                classes: [
                  ...data.classes,
                  {
                    id: newId("class", data.classes.map((klass) => klass.id)),
                    label: "",
                    color: STARTING_COLORS[index % STARTING_COLORS.length],
                    shape: SHAPES[index % SHAPES.length],
                  },
                ],
              });
            }}
          >
            {t("addClass")}
          </button>
        </div>
      </fieldset>

      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <span className="bitflow-hint">{t("previewHint")}</span>
        <PlotView data={data} locale={locale} onPlacePoint={addPoint} />
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("pointsLabel")}</legend>
        <span className="bitflow-hint">{t("pointsHint")}</span>
        {errorAt(errors, "points") && (
          <span className="bitflow-field-error" role="alert">
            {errorAt(errors, "points")}
          </span>
        )}
        {pointErrors.map((message) => (
          <span key={message} className="bitflow-field-error" role="alert">
            {message}
          </span>
        ))}
        {data.points.length === 0 && <p className="bitflow-text-muted">{t("noPoints")}</p>}
        {data.points.map((point, index) => {
          const role = roleOf(point);
          const position = index + 1;
          const classField = role === "open" ? "expected" : "class";
          return (
            <div key={point.id} className="bitflow-point-plot-editor-row">
              <NumberInput
                className="bitflow-input bitflow-point-plot-number"
                value={point.x}
                aria-label={t("pointXOf", { position })}
                onChange={(x) => setPoint(point.id, { x })}
              />
              <NumberInput
                className="bitflow-input bitflow-point-plot-number"
                value={point.y}
                aria-label={t("pointYOf", { position })}
                onChange={(y) => setPoint(point.id, { y })}
              />
              <input
                type="text"
                className="bitflow-input"
                value={point.label ?? ""}
                placeholder={t("unnamedPoint", { number: position })}
                aria-label={t("pointLabelOf", { position })}
                onChange={(event) =>
                  setPoint(point.id, { label: event.target.value || undefined })
                }
              />
              <select
                className="bitflow-select"
                value={role}
                aria-label={t("pointRoleOf", { position })}
                onChange={(event) => setRole(point, event.target.value as PointRole)}
              >
                <option value="known">{t("roleKnown")}</option>
                <option value="open">{t("roleOpen")}</option>
                <option value="centroid">{t("roleCentroid")}</option>
              </select>
              <select
                className="bitflow-select"
                value={point[classField] ?? ""}
                aria-label={t(role === "open" ? "pointExpectedOf" : "pointClassOf", { position })}
                onChange={(event) =>
                  setPoint(point.id, { [classField]: event.target.value || undefined })
                }
              >
                <option value="">{t("chooseNone")}</option>
                {data.classes.map((klass, classIndex) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.label || t("unnamedClass", { number: classIndex + 1 })}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                aria-label={t("removePointOf", { position })}
                onClick={() =>
                  patch({ points: data.points.filter((other) => other.id !== point.id) })
                }
              >
                ✕
              </button>
            </div>
          );
        })}
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              addPoint(
                (data.axes.x.min + data.axes.x.max) / 2,
                (data.axes.y.min + data.axes.y.max) / 2,
              )
            }
          >
            {t("addPoint")}
          </button>
        </div>
      </fieldset>

      {/* The two algorithms the book teaches, applied to the points above, so
          an author does not work out by hand which cluster a point is nearest
          to. They only fill in the answer key; evaluation still compares
          against whatever `expected` ends up being. */}
      <div className="bitflow-field">
        <span className="bitflow-label">{t("fillByCentroidLabel")}</span>
        <span className="bitflow-hint">{t("fillByCentroidHint")}</span>
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            disabled={centroids(data).length === 0}
            onClick={() => fillBy((point) => nearestCentroid(byClassOrder(centroids(data)), point))}
          >
            {t("apply")}
          </button>
        </div>
      </div>

      <div className="bitflow-field">
        <span className="bitflow-label">{t("fillByKnnLabel")}</span>
        <span className="bitflow-hint">{t("fillByKnnHint", { k })}</span>
        <div className="bitflow-row">
          <Field label={t("knnKLabel")}>
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                step={1}
                className="bitflow-input bitflow-point-plot-number"
                value={k}
                onChange={(event) => {
                  const next = Math.trunc(Number(event.target.value));
                  if (next >= 1) setK(next);
                }}
              />
            )}
          </Field>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            disabled={knownPoints(data).length === 0}
            onClick={() => fillBy((point) => knn(byClassOrder(knownPoints(data)), point, k))}
          >
            {t("apply")}
          </button>
        </div>
      </div>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("showGridLabel")}
          hint={t("showGridHint")}
          checked={data.showGrid}
          onChange={(showGrid) => patch({ showGrid })}
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
