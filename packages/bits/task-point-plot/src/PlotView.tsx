import { translate, type Locale } from "@bitflow/core";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type RefObject,
} from "react";
import type { PointStates } from "./evaluate";
import { messages } from "./messages";
import {
  MARGIN,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  formatTick,
  snapToAxis,
  ticksFor,
  xFromView,
  xToView,
  yFromView,
  yToView,
} from "./plot";
import {
  classById,
  classLabel,
  openPoints,
  roleOf,
  type Answer,
  type Data,
  type Point,
  type Shape as ShapeName,
} from "./schema";

const POINT_SIZE = 16;
const CENTROID_SIZE = 26;
/**
 * The invisible circle a tap actually has to land in. 42 view units, at the
 * REFERENCE_WIDTH this plot is designed to still be usable at, comes out to
 * roughly 24px on screen — comfortably past the ≥22px a fingertip needs, and
 * it only grows from there on anything narrower (the scale below) or wider
 * (the viewBox's own scaling).
 */
const HIT_RADIUS = 42;

/**
 * Same numbers and the same reasoning as task-graph-path's `useGraphScale`:
 * the viewBox scales every user unit by rendered-width / VIEW_WIDTH, which
 * shrinks a fixed marker size and a fixed font size right along with the
 * element. Below REFERENCE_WIDTH that shrink is measured and undone; MAX_SCALE
 * caps how far the undoing goes, so an extremely narrow host does not blow the
 * plot out of proportion to the page around it.
 */
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

// --- marker geometry ---------------------------------------------------------

const trianglePoints = (size: number): string => {
  const h = size * 1.05;
  return `0,${-h} ${h * 0.92},${h * 0.62} ${-h * 0.92},${h * 0.62}`;
};
const diamondPoints = (size: number): string =>
  `0,${-size} ${size},0 0,${size} ${-size},0`;
const squarePoints = (size: number): string => {
  const s = size * 0.82;
  return `${-s},${-s} ${s},${-s} ${s},${s} ${-s},${s}`;
};

/**
 * A class's shape, drawn at `size`. A circle is its own primitive; the rest
 * are polygons, because SVG has no built-in triangle or diamond. `size` is a
 * rough circumradius for all four, so none of them reads as dramatically
 * bigger than its neighbours at the same setting.
 */
const Marker = ({
  shape,
  size,
  className,
  style,
}: {
  shape: ShapeName;
  size: number;
  className?: string;
  style?: CSSProperties;
}): ReactElement => {
  if (shape === "circle") return <circle r={size} className={className} style={style} />;
  const points =
    shape === "square"
      ? squarePoints(size)
      : shape === "triangle"
        ? trianglePoints(size)
        : diamondPoints(size);
  return <polygon points={points} className={className} style={style} />;
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export type PlotViewProps = {
  data: Data;
  answer?: Answer;
  /** Open point id → whether it was marked right, once the task is graded. */
  states?: PointStates;
  locale: Locale;
  readonly?: boolean;
  /**
   * Present in the learner's view. `classId` is `undefined` when the tap
   * cleared the point (the same class was already assigned there); the
   * component works out that toggle itself, so the caller only ever writes
   * what it is told.
   */
  onAssign?: (pointId: string, classId: string | undefined) => void;
  /** Authoring only: clicking empty plot area adds a point there. */
  onPlacePoint?: (x: number, y: number) => void;
};

export const PlotView = ({
  data,
  answer,
  states,
  locale,
  readonly,
  onAssign,
  onPlacePoint,
}: PlotViewProps): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const svg = useRef<SVGSVGElement | null>(null);
  const scale = usePlotScale(svg);
  const [active, setActive] = useState<string | undefined>(data.classes[0]?.id);
  const [announcement, setAnnounce] = useState("");

  const live = Boolean(onAssign) && !readonly;
  const assignments = answer?.assignments ?? {};
  const xTicks = ticksFor(data.axes.x);
  const yTicks = ticksFor(data.axes.y);

  /** Sets (or, given `undefined`, clears) one point's assignment outright. */
  const setAssignment = (point: Point, classId: string | undefined) => {
    if (!onAssign) return;
    onAssign(point.id, classId);
    const pointName = point.label || point.id;
    setAnnounce(
      classId === undefined
        ? t("openUnassigned", { label: pointName })
        : t("openAssigned", { label: pointName, class: classLabel(data, classId) }),
    );
  };

  /** The diagram's own gesture: tapping the same class again clears the point. */
  const tapAssign = (point: Point, classId: string) =>
    setAssignment(point, assignments[point.id] === classId ? undefined : classId);

  const placeAt = (event: ReactMouseEvent<SVGRectElement>) => {
    if (!onPlacePoint) return;
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    const viewX = ((event.clientX - box.left) / box.width) * VIEW_WIDTH;
    const viewY = ((event.clientY - box.top) / box.height) * VIEW_HEIGHT;
    onPlacePoint(
      snapToAxis(data.axes.x, xFromView(data.axes.x, viewX)),
      snapToAxis(data.axes.y, yFromView(data.axes.y, viewY)),
    );
  };

  // Each marker is drawn round its own origin and scaled there, so on a narrow
  // screen a point grows to a size a finger can find while its position on
  // the axes stays exactly where the data puts it.
  const cx = (point: Point) => xToView(data.axes.x, point.x);
  const cy = (point: Point) => yToView(data.axes.y, point.y);

  const nonCentroids = data.points.filter((point) => !point.centroid);
  const centroidPoints = data.points.filter((point) => point.centroid);

  return (
    <div className="bitflow-point-plot">
      <svg
        ref={svg}
        className="bitflow-point-plot-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={t("diagramLabel")}
        // Read by the stylesheet for tick and label font-size, and for the
        // markers' outline width — a fallback of 1 is what a host without a
        // ResizeObserver (jsdom included) leaves it at.
        style={{ "--bitflow-point-plot-scale": scale } as CSSProperties}
      >
        {data.showGrid && (
          <g className="bitflow-point-plot-grid">
            {xTicks.map((tick) => (
              <line
                key={`x${tick}`}
                x1={xToView(data.axes.x, tick)}
                x2={xToView(data.axes.x, tick)}
                y1={MARGIN.top}
                y2={MARGIN.top + PLOT_HEIGHT}
              />
            ))}
            {yTicks.map((tick) => (
              <line
                key={`y${tick}`}
                y1={yToView(data.axes.y, tick)}
                y2={yToView(data.axes.y, tick)}
                x1={MARGIN.left}
                x2={MARGIN.left + PLOT_WIDTH}
              />
            ))}
          </g>
        )}

        <g className="bitflow-point-plot-axis">
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
        </g>

        <g className="bitflow-point-plot-ticks">
          {xTicks.map((tick) => (
            <text
              key={`xt${tick}`}
              x={xToView(data.axes.x, tick)}
              y={MARGIN.top + PLOT_HEIGHT + 8 + 22 * scale}
              textAnchor="middle"
            >
              {formatTick(tick)}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text
              key={`yt${tick}`}
              x={MARGIN.left - 10}
              y={yToView(data.axes.y, tick)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatTick(tick)}
            </text>
          ))}
        </g>

        {data.axes.x.label && (
          <text
            className="bitflow-point-plot-axis-label"
            x={MARGIN.left + PLOT_WIDTH / 2}
            y={VIEW_HEIGHT - 10}
            textAnchor="middle"
          >
            {data.axes.x.label}
          </text>
        )}
        {data.axes.y.label && (
          <text
            className="bitflow-point-plot-axis-label"
            textAnchor="middle"
            transform={`translate(${8 + 14 * scale} ${MARGIN.top + PLOT_HEIGHT / 2}) rotate(-90)`}
          >
            {data.axes.y.label}
          </text>
        )}

        {/* The click target for adding a point in the authoring preview. It
            sits under every marker, so a click that actually lands on a point
            (which paints its own fill or, for a hollow one, nothing) never
            reaches this rect — a marker never has its own click handler in
            this mode, so “clicking a point” and “clicking empty space right
            next to it” cannot be confused with each other. */}
        {onPlacePoint && (
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="transparent"
            className="bitflow-point-plot-catcher"
            onClick={placeAt}
          />
        )}

        {nonCentroids.map((point) => {
          const role = roleOf(point);
          const assigned = assignments[point.id];
          const state = states?.[point.id];
          const klass = classById(data, role === "known" ? point.class : assigned);

          return (
            <g
              key={point.id}
              className="bitflow-point-plot-point"
              transform={`translate(${cx(point)} ${cy(point)}) scale(${scale})`}
            >
              {role === "open" && live && (
                <circle
                  r={HIT_RADIUS}
                  className="bitflow-point-plot-hit"
                  onClick={() => active !== undefined && tapAssign(point, active)}
                />
              )}

              {role === "open" && !klass ? (
                <>
                  <Marker
                    shape="circle"
                    size={POINT_SIZE}
                    style={{ "--bitflow-point-plot-color": "transparent" } as CSSProperties}
                  />
                  <text className="bitflow-point-plot-mark">?</text>
                </>
              ) : (
                klass && (
                  <>
                    <Marker
                      shape={klass.shape}
                      size={POINT_SIZE}
                      style={{ "--bitflow-point-plot-color": klass.color } as CSSProperties}
                    />
                    {/* The ring that says "this one was open" — the same shape
                        and colour as an always-known point would carry alone,
                        so the ring is the only thing telling them apart. */}
                    {role === "open" && (
                      <circle
                        r={POINT_SIZE + 6}
                        className="bitflow-point-plot-ring"
                      />
                    )}
                  </>
                )
              )}

              {state && (
                <text
                  className={
                    state === "correct"
                      ? "bitflow-point-plot-verdict bitflow-point-plot-verdict-correct"
                      : "bitflow-point-plot-verdict bitflow-point-plot-verdict-wrong"
                  }
                  x={POINT_SIZE + 14}
                  y={-(POINT_SIZE + 8)}
                >
                  {state === "correct" ? "✓" : "✗"}
                </text>
              )}

              {point.label && (
                <text className="bitflow-point-plot-label" y={-(POINT_SIZE + 10)}>
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Centroids drawn last, over ordinary points, since a cluster centre
            is the one thing on this plot that is never hidden by another
            marker sitting on top of it. */}
        {centroidPoints.map((point) => {
          const klass = classById(data, point.class);
          if (!klass) return null;
          return (
            <g
              key={point.id}
              className="bitflow-point-plot-centroid"
              transform={`translate(${cx(point)} ${cy(point)}) scale(${scale})`}
              style={{ "--bitflow-point-plot-color": klass.color } as CSSProperties}
            >
              <title>{t("centroidTitle", { class: classLabel(data, point.class) })}</title>
              <circle r={CENTROID_SIZE} />
              <line x1={-CENTROID_SIZE * 0.6} y1={0} x2={CENTROID_SIZE * 0.6} y2={0} />
              <line x1={0} y1={-CENTROID_SIZE * 0.6} x2={0} y2={CENTROID_SIZE * 0.6} />
              {point.label && (
                <text className="bitflow-point-plot-label" y={-(CENTROID_SIZE + 8)}>
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {onAssign && (
        <AssignmentControls
          data={data}
          answer={answer}
          states={states}
          locale={locale}
          readonly={readonly}
          active={active}
          setActive={setActive}
          onAssign={setAssignment}
        />
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};

/**
 * The palette and the per-point fallback list: the keyboard and screen-reader
 * route, and — on a phone — often the more precise one too. Tapping a point on
 * the diagram does exactly what choosing it here does, and nothing more.
 */
const AssignmentControls = ({
  data,
  answer,
  states,
  locale,
  readonly,
  active,
  setActive,
  onAssign,
}: {
  data: Data;
  answer?: Answer;
  states?: PointStates;
  locale: Locale;
  readonly?: boolean;
  active: string | undefined;
  setActive: (id: string) => void;
  onAssign: (point: Point, classId: string | undefined) => void;
}): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const assignments = answer?.assignments ?? {};
  const open = openPoints(data);
  // A radio group of its own: the authoring form puts a learner preview on the
  // same page, and a shared `name` would tie the two palettes together.
  const group = useId();

  return (
    <div className="bitflow-stack-small bitflow-stack">
      {!readonly && (
        <div
          className="bitflow-point-plot-palette"
          role="radiogroup"
          aria-label={t("paletteLabel")}
        >
          {data.classes.map((klass) => (
            <label key={klass.id} className="bitflow-point-plot-swatch">
              <input
                type="radio"
                name={group}
                className="bitflow-visually-hidden"
                checked={active === klass.id}
                onChange={() => setActive(klass.id)}
              />
              <svg
                className="bitflow-point-plot-swatch-icon"
                viewBox="-20 -20 40 40"
                aria-hidden="true"
                style={{ "--bitflow-point-plot-color": klass.color } as CSSProperties}
              >
                <Marker shape={klass.shape} size={16} />
              </svg>
              <span>{klass.label || klass.id}</span>
            </label>
          ))}
        </div>
      )}

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("assignmentsLabel")}</legend>
        <span className="bitflow-hint">{t("assignmentsHint")}</span>
        {open.map((point) => {
          const pointName = point.label || point.id;
          const state = states?.[point.id];
          return (
            <div key={point.id} className="bitflow-point-plot-row">
              <span className="bitflow-point-plot-row-label">
                {t("pointRow", { label: pointName, x: point.x, y: point.y })}
              </span>
              <select
                className="bitflow-select"
                aria-label={t("selectLabel", { point: pointName })}
                value={assignments[point.id] ?? ""}
                disabled={readonly}
                onChange={(event) =>
                  onAssign(point, event.target.value || undefined)
                }
              >
                <option value="">{t("chooseClass")}</option>
                {data.classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.label || klass.id}
                  </option>
                ))}
              </select>
              {state && (
                <span
                  className={
                    state === "correct"
                      ? "bitflow-point-plot-badge bitflow-point-plot-badge-correct"
                      : "bitflow-point-plot-badge bitflow-point-plot-badge-wrong"
                  }
                  aria-hidden="true"
                >
                  {state === "correct" ? "✓" : "✗"}
                </span>
              )}
              {state && (
                <span className="bitflow-visually-hidden">{t(state)}</span>
              )}
            </div>
          );
        })}
      </fieldset>
    </div>
  );
};
