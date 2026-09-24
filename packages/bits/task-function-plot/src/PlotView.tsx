import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type RefObject,
} from "react";
import { sampleCurve } from "./curve";
import { handleKey, type HandleStates } from "./evaluate";
import { formulaFn } from "./formula";
import { messages } from "./messages";
import { NumberInput } from "./NumberInput";
import {
  defaultHandleValue,
  formatTick,
  keyboardPageStep,
  keyboardStep,
  MARGIN,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  snapValue,
  labelledTicks,
  ticksFor,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  xToView,
  yFromView,
  yToView,
} from "./plot";
import type { Answer, Data } from "./schema";

const KNOB_RADIUS = 14;
/**
 * The invisible circle a drag actually has to land in, and the only part of
 * the knob with `touch-action: none` (see the stylesheet) — the widened
 * target a fingertip needs, not the plot as a whole, which must keep
 * scrolling normally when a swipe starts anywhere else on it. The number and
 * the reasoning are copied from task-point-plot's `HIT_RADIUS`: at
 * REFERENCE_WIDTH, on a screen as narrow as 326px, this comes out well past
 * the 36px (18px radius) a touch target needs.
 */
const HIT_RADIUS = 42;

/** Same numbers and the same reasoning as task-point-plot's `usePlotScale`:
 *  the viewBox scales every user unit by rendered-width / VIEW_WIDTH, which
 *  shrinks a fixed knob or font size right along with the element. Below
 *  REFERENCE_WIDTH that shrink is measured and undone; MAX_SCALE caps how far
 *  the undoing goes. */
const REFERENCE_WIDTH = 560;
const MAX_SCALE = 2.2;

const usePlotScale = (ref: RefObject<SVGSVGElement | null>): number => {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      setScale(Math.min(MAX_SCALE, Math.max(1, REFERENCE_WIDTH / width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
};

/** A small fixed palette for `shown` curves, cycled by index. Good for the
 *  handful of reference curves a task realistically draws (usually just one —
 *  the `f` behind a "sketch f′" question); not a general categorical scale. */
const SHOWN_COLORS = [
  "var(--bitflow-color-info)",
  "var(--bitflow-color-manual)",
  "var(--bitflow-color-warning)",
];

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** A drag in progress: which handle (identified by its x — handles are
 *  validated distinct) and the y it is currently over. Held in a ref rather
 *  than state, redrawn through a counter, on the gesture pattern every other
 *  drag in this codebase uses: a pointer gesture can deliver several events
 *  within one frame, and reading the drag from state would mean `pointerup`
 *  still saw whatever was there before `pointerdown`'s render landed. */
type Drag = { x: number; value: number };

export type PlotViewProps = {
  data: Data;
  answer?: Answer;
  /** Present once the task has been marked. */
  states?: HandleStates;
  locale: Locale;
  readonly?: boolean;
  /** Sets one handle's value, already snapped. Present in the learner's view;
   *  absent (or `readonly`) draws the plot without any way to change it. */
  onSet?: (x: number, value: number) => void;
  /** Forces the target curve to draw even without a graded result. Only the
   *  authoring preview sets this — the learner never sees the target until
   *  `states` says the task has actually been marked. */
  revealTarget?: boolean;
};

export const PlotView = ({
  data,
  answer,
  states,
  locale,
  readonly,
  onSet,
  revealTarget,
}: PlotViewProps): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const svg = useRef<SVGSVGElement | null>(null);
  const scale = usePlotScale(svg);
  const dragRef = useRef<Drag | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const [announcement, setAnnouncement] = useState("");

  const live = Boolean(onSet) && !readonly;
  const values = answer?.values ?? {};
  const axisX = data.axes.x;
  const axisY = data.axes.y;
  const xTicks = ticksFor(axisX);
  const yTicks = ticksFor(axisY);
  const showTarget = revealTarget ?? Boolean(states);

  /** A client Y, as a y in axis units — the one conversion every pointer
   *  gesture on this plot goes through. `null` while the element has no
   *  measurable size yet (e.g. before the first layout in a test). */
  const yFromClientY = (clientY: number): number | null => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.height === 0) return null;
    const viewY = ((clientY - box.top) / box.height) * VIEW_HEIGHT;
    return yFromView(axisY, viewY);
  };

  const commit = (x: number, value: number) => {
    if (!onSet) return;
    onSet(x, value);
    setAnnouncement(
      t("handleSet", { x: formatTick(x), y: formatTick(value) }),
    );
  };

  const startKnobDrag = (event: ReactPointerEvent, x: number) => {
    if (!live || event.button !== 0) return;
    const y = yFromClientY(event.clientY);
    if (y === null) return;
    dragRef.current = { x, value: snapValue(axisY, y, data.snap) };
    redraw();
  };

  // Absolute position on every move, not an accumulated per-frame delta —
  // sidesteps the drag-distance trap in CLAUDE.md entirely, since a slow drag
  // made of many tiny moves lands on exactly the same value a single big jump
  // to the same point would.
  const moveKnobDrag = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const y = yFromClientY(event.clientY);
    if (y === null) return;
    dragRef.current = { x: drag.x, value: snapValue(axisY, y, data.snap) };
    redraw();
  };

  const endKnobDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    redraw();
    commit(drag.x, drag.value);
  };

  // The window sees the whole gesture: the pointer leaves the small knob
  // almost immediately, and a release outside the page never reaches it.
  usePointerDrag(moveKnobDrag, endKnobDrag);

  /** A tap (or click) anywhere on a handle's track sets it outright — the
   *  discrete counterpart to dragging the knob. A plain `onClick`, not a
   *  pointer gesture: it only ever fires for a genuine tap or click, never for
   *  a touch that turns into a scroll, so the track needs no `touch-action`
   *  override and a swipe over it keeps scrolling the page. */
  const trackClick = (event: ReactMouseEvent, x: number) => {
    if (!live) return;
    const y = yFromClientY(event.clientY);
    if (y === null) return;
    commit(x, snapValue(axisY, y, data.snap));
  };

  const onKnobKeyDown = (event: ReactKeyboardEvent, x: number, value: number) => {
    if (!live) return;
    let next: number | undefined;
    switch (event.key) {
      case "ArrowUp":
        next = value + keyboardStep(axisY);
        break;
      case "ArrowDown":
        next = value - keyboardStep(axisY);
        break;
      case "PageUp":
        next = value + keyboardPageStep(axisY);
        break;
      case "PageDown":
        next = value - keyboardPageStep(axisY);
        break;
      case "Home":
        next = axisY.min;
        break;
      case "End":
        next = axisY.max;
        break;
      default:
        return;
    }
    event.preventDefault();
    commit(x, snapValue(axisY, next, data.snap));
  };

  /** How wide a handle's clickable track is, in view units: half the gap to
   *  its nearest neighbour, so two tracks never overlap, capped so a lone
   *  handle (or two far apart) does not claim the whole plot. */
  const trackHalfWidth = (() => {
    const sorted = [...data.handles].sort((a, b) => a - b);
    let minGap = axisX.max - axisX.min;
    for (let i = 1; i < sorted.length; i++) {
      minGap = Math.min(minGap, sorted[i] - sorted[i - 1]);
    }
    const viewGap = (minGap / (axisX.max - axisX.min || 1)) * PLOT_WIDTH;
    return Math.min(70, Math.max(10, viewGap / 2));
  })();

  // The learner's own sketch: a polyline through the handles that are
  // actually set, left to right. Not a spline — a spline can round a corner
  // (a parabola's vertex, a deliberate kink) that the knobs were placed to
  // mark sharply, into a curl the learner never drew, which can visually read
  // as closer to the target than the answer actually given. A straight
  // segment between two knobs is exactly as informative as the knobs
  // themselves, and looks wrong exactly where the answer is wrong.
  const sketchPoints = [...data.handles]
    .sort((a, b) => a - b)
    .map((x) => ({ x, value: dragRef.current?.x === x ? dragRef.current.value : values[handleKey(x)] }))
    .filter((point): point is { x: number; value: number } => point.value !== undefined);

  const shownCurves = data.shown
    .filter((curve) => curve.expression.trim() !== "")
    .map((curve, index) => ({
      ...curve,
      color: SHOWN_COLORS[index % SHOWN_COLORS.length],
      segments: sampleCurve(formulaFn(curve.expression), axisX, axisY),
    }));

  const targetSegments = showTarget ? sampleCurve(formulaFn(data.target), axisX, axisY) : [];

  const toViewPoints = (segment: { x: number; y: number }[]) =>
    segment.map((point) => `${xToView(axisX, point.x)},${yToView(axisY, point.y)}`).join(" ");

  return (
    <div className="bitflow-function-plot">
      <svg
        ref={svg}
        className="bitflow-function-plot-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        // A group, not an image: the sliders on it are controls, and the
        // children of an image are presentational to assistive technology.
        role="group"
        aria-label={t("diagramLabel")}
        style={{ "--bitflow-function-plot-scale": scale } as CSSProperties}
      >
        <defs>
          {/* `shown` curves (and the target, once revealed) may leave the
              y‑axis; this is what actually cuts them off at its edge rather
              than merely keeping their coordinates from blowing up. */}
          <clipPath id="function-plot-clip">
            <rect x={MARGIN.left} y={MARGIN.top} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
          </clipPath>
        </defs>

        <g className="bitflow-function-plot-grid">
          {xTicks.map((tick) => (
            <line
              key={`x${tick}`}
              x1={xToView(axisX, tick)}
              x2={xToView(axisX, tick)}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
            />
          ))}
          {yTicks.map((tick) => (
            <line
              key={`y${tick}`}
              y1={yToView(axisY, tick)}
              y2={yToView(axisY, tick)}
              x1={MARGIN.left}
              x2={MARGIN.left + PLOT_WIDTH}
            />
          ))}
        </g>

        {/* The plot's own bounding box, at its edges rather than at whichever
            axis's zero — the same choice task-point-plot makes, and for the
            same reason: an axis need not contain zero at all (a target drawn
            entirely above the x‑axis, say), and a line drawn at a zero outside
            the range would spill past the plot it is meant to frame. */}
        <g className="bitflow-function-plot-axis">
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + PLOT_WIDTH}
            y1={MARGIN.top + PLOT_HEIGHT}
            y2={MARGIN.top + PLOT_HEIGHT}
          />
          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
          />
          {/* The zero line itself, when the axis actually contains it — worth
              marking distinctly from an ordinary gridline since it is where a
              learner reads "positive" from "negative". */}
          {axisX.min < 0 && axisX.max > 0 && (
            <line
              className="bitflow-function-plot-zero"
              x1={xToView(axisX, 0)}
              x2={xToView(axisX, 0)}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
            />
          )}
          {axisY.min < 0 && axisY.max > 0 && (
            <line
              className="bitflow-function-plot-zero"
              x1={MARGIN.left}
              x2={MARGIN.left + PLOT_WIDTH}
              y1={yToView(axisY, 0)}
              y2={yToView(axisY, 0)}
            />
          )}
        </g>

        <g className="bitflow-function-plot-ticks">
          {labelledTicks(xTicks, axisX.step, 11).map((tick) => (
            <text
              key={`xt${tick}`}
              x={xToView(axisX, tick)}
              y={MARGIN.top + PLOT_HEIGHT + 8 + 22 * scale}
              textAnchor="middle"
            >
              {formatTick(tick)}
            </text>
          ))}
          {/* Fewer labels up the side than along the bottom: the plot is
              wider than it is tall, and a phone scales the labels up. */}
          {labelledTicks(yTicks, axisY.step, 8).map((tick) => (
            <text
              key={`yt${tick}`}
              x={MARGIN.left - 10}
              y={yToView(axisY, tick)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatTick(tick)}
            </text>
          ))}
        </g>

        {axisX.label && (
          <text
            className="bitflow-function-plot-axis-label"
            x={MARGIN.left + PLOT_WIDTH / 2}
            y={VIEW_HEIGHT - 10}
            textAnchor="middle"
          >
            {axisX.label}
          </text>
        )}
        {axisY.label && (
          <text
            className="bitflow-function-plot-axis-label"
            textAnchor="middle"
            transform={`translate(${8 + 14 * scale} ${MARGIN.top + PLOT_HEIGHT / 2}) rotate(-90)`}
          >
            {axisY.label}
          </text>
        )}

        <g clipPath="url(#function-plot-clip)">
          {shownCurves.map((curve, index) =>
            curve.segments.map((segment, segmentIndex) =>
              segment.length < 2 ? null : (
                <polyline
                  key={`shown-${index}-${segmentIndex}`}
                  className="bitflow-function-plot-shown"
                  points={toViewPoints(segment)}
                  style={{ "--bitflow-function-plot-color": curve.color } as CSSProperties}
                />
              ),
            ),
          )}
          {targetSegments.map((segment, index) =>
            segment.length < 2 ? null : (
              <polyline
                key={`target-${index}`}
                className="bitflow-function-plot-target"
                points={toViewPoints(segment)}
              />
            ),
          )}
        </g>

        {sketchPoints.length >= 2 && (
          <polyline
            className="bitflow-function-plot-sketch"
            points={sketchPoints
              .map((point) => `${xToView(axisX, point.x)},${yToView(axisY, point.value)}`)
              .join(" ")}
          />
        )}

        {data.handles.map((x) => {
          const key = handleKey(x);
          const dragging = dragRef.current?.x === x;
          const stored = values[key];
          const isSet = dragging || stored !== undefined;
          const value = dragging
            ? dragRef.current!.value
            : (stored ?? defaultHandleValue(axisY));
          const state = states?.[key];
          const cx = xToView(axisX, x);
          const cy = yToView(axisY, value);

          const knobClasses = ["bitflow-function-plot-knob"];
          if (state) knobClasses.push(`bitflow-function-plot-knob-${state}`);
          else if (isSet) knobClasses.push("bitflow-function-plot-knob-set");

          return (
            <g key={key}>
              <line
                className="bitflow-function-plot-track"
                x1={cx}
                x2={cx}
                y1={MARGIN.top}
                y2={MARGIN.top + PLOT_HEIGHT}
              />
              {live && (
                <rect
                  className="bitflow-function-plot-track-hit"
                  x={cx - trackHalfWidth}
                  width={trackHalfWidth * 2}
                  y={MARGIN.top}
                  height={PLOT_HEIGHT}
                  onClick={(event) => trackClick(event, x)}
                />
              )}
              <g
                className={knobClasses.join(" ")}
                transform={`translate(${cx} ${cy}) scale(${scale})`}
                role={live ? "slider" : undefined}
                aria-orientation={live ? "vertical" : undefined}
                tabIndex={live ? 0 : undefined}
                aria-label={live ? t("knobLabel", { x: formatTick(x) }) : undefined}
                aria-valuemin={live ? axisY.min : undefined}
                aria-valuemax={live ? axisY.max : undefined}
                aria-valuenow={live ? value : undefined}
                aria-valuetext={
                  live
                    ? state
                      ? t("knobValueStateText", { x: formatTick(x), y: formatTick(value), state: t(state) })
                      : t("knobValueText", { x: formatTick(x), y: formatTick(value) })
                    : undefined
                }
                onPointerDown={(event) => startKnobDrag(event, x)}
                onKeyDown={(event) => onKnobKeyDown(event, x, value)}
              >
                {live && <circle className="bitflow-function-plot-knob-hit" r={HIT_RADIUS} />}
                <circle className="bitflow-function-plot-knob-ring" r={KNOB_RADIUS + 6} />
                <circle className="bitflow-function-plot-knob-fill" r={KNOB_RADIUS} />
                {state && (
                  <text className="bitflow-function-plot-verdict" x={KNOB_RADIUS + 10} y={-(KNOB_RADIUS + 6)}>
                    {state === "correct" ? "✓" : "✗"}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {(data.shown.length > 0 || showTarget) && (
        <ul className="bitflow-function-plot-legend">
          {shownCurves.map((curve, index) => (
            <li key={index}>
              <span
                className="bitflow-function-plot-legend-swatch"
                style={{ "--bitflow-function-plot-color": curve.color } as CSSProperties}
                aria-hidden="true"
              />
              {curve.label || t("unnamedCurve", { number: index + 1 })}
            </li>
          ))}
          {showTarget && (
            <li>
              <span
                className="bitflow-function-plot-legend-swatch bitflow-function-plot-legend-swatch-target"
                aria-hidden="true"
              />
              {t("targetLegend")}
            </li>
          )}
        </ul>
      )}

      <HandleFields
        data={data}
        answer={answer}
        states={states}
        locale={locale}
        readonly={readonly}
        onSet={onSet}
      />

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};

/**
 * One number field per handle: the precise way to answer on a phone (no
 * dragging required) and the only way a screen reader can — the slider role on
 * the knob announces its value, but setting one from scratch by keyboard is
 * far more direct here than nudging up from wherever the knob happens to
 * start. Always visible, not tucked behind a disclosure: this is a primary
 * input method, not a secondary description of one.
 */
const HandleFields = ({
  data,
  answer,
  states,
  locale,
  readonly,
  onSet,
}: {
  data: Data;
  answer?: Answer;
  states?: HandleStates;
  locale: Locale;
  readonly?: boolean;
  onSet?: (x: number, value: number) => void;
}): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const values = answer?.values ?? {};
  const live = Boolean(onSet) && !readonly;

  return (
    <fieldset className="bitflow-field bitflow-function-plot-fields">
      <legend className="bitflow-label">{t("valuesLabel")}</legend>
      <span className="bitflow-hint">{t("valuesHint")}</span>
      {[...data.handles]
        .sort((a, b) => a - b)
        .map((x) => {
          const key = handleKey(x);
          const stored = values[key];
          const state = states?.[key];
          return (
            <div key={key} className="bitflow-function-plot-row">
              <span className="bitflow-function-plot-row-label">
                {t("handleRow", { x: formatTick(x) })}
              </span>
              <NumberInput
                className="bitflow-input bitflow-function-plot-number"
                value={stored ?? defaultHandleValue(data.axes.y)}
                disabled={readonly || !live}
                aria-label={t("handleFieldLabel", { x: formatTick(x) })}
                onChange={(value) => onSet?.(x, snapValue(data.axes.y, value, data.snap))}
              />
              {state && (
                <span
                  className={
                    state === "correct"
                      ? "bitflow-function-plot-badge bitflow-function-plot-badge-correct"
                      : "bitflow-function-plot-badge bitflow-function-plot-badge-wrong"
                  }
                  aria-hidden="true"
                >
                  {state === "correct" ? "✓" : "✗"}
                </span>
              )}
              {state && <span className="bitflow-visually-hidden">{t(state)}</span>}
            </div>
          );
        })}
    </fieldset>
  );
};
