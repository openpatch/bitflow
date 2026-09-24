import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type RefObject,
} from "react";
import type { ItemStates } from "./evaluate";
import {
  keyboardStepFor,
  LINE_Y,
  MARGIN,
  PLOT_WIDTH,
  snapValue,
  stackLabels,
  ticksFor,
  valueToView,
  viewToValue,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  formatValue,
} from "./line";
import { messages } from "./messages";
import type { Answer, Data, Item } from "./schema";

const MARKER_R = 9;
/**
 * The invisible circle a tap or a finger actually has to land in. 36 view
 * units at the REFERENCE_WIDTH `useLineScale` is tuned to comes out to about
 * 20px on screen — a 40px touch target — and it only grows from there on
 * anything narrower, the same reasoning as task-point-plot's `HIT_RADIUS`.
 */
const HIT_RADIUS = 36;
const MAJOR_TICK_HALF = 14;
const MINOR_TICK_HALF = 7;
/** Half the height of the tappable band around the line — much taller than
 *  the hairline itself, so a finger does not have to land on it exactly. */
const CATCH_HALF = 40;
const LABEL_BASE = 26;
const LABEL_LANE = 22;
/** View units two labels must clear before they are allowed to share a lane. */
const LABEL_MIN_GAP = 70;
/** Pixels a pointer has to travel before a press counts as a drag rather than
 *  a tap that will select the marker instead — the same idea as the number
 *  line this bit started from, and the drag-distance rule in task-drag-drop:
 *  measured from where the gesture began, not from the last event. */
const DRAG_THRESHOLD = 4;

/**
 * Same reasoning as task-point-plot's `usePlotScale`: the viewBox scales
 * every user unit by rendered-width / VIEW_WIDTH, which shrinks a fixed
 * marker size and a fixed font size right along with the element. Below
 * REFERENCE_WIDTH that shrink is measured and undone, so a tick label stays
 * readable and a marker stays a real touch target on a phone.
 */
const REFERENCE_WIDTH = 560;
const MAX_SCALE = 2.2;

const useLineScale = (ref: RefObject<SVGSVGElement | null>): number => {
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

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** A drag in progress: the value the marker is currently over, and whether
 *  the pointer has moved far enough from where it went down to count as a
 *  drag rather than a tap that only re-selects the marker. */
type Drag = {
  itemId: string;
  startClientX: number;
  value: number;
  moved: boolean;
};

export type NumberLineViewProps = {
  data: Data;
  answer?: Answer;
  /** Item id → whether it was marked right, once the task is graded. */
  states?: ItemStates;
  locale: Locale;
  readonly?: boolean;
  /** Present in the learner's view. Absent — or `readonly` — draws the line
   *  inert: no palette, no catcher, no draggable or focusable markers. */
  onPlace?: (itemId: string, value: number) => void;
};

export const NumberLineView = ({
  data,
  answer,
  states,
  locale,
  readonly,
  onPlace,
}: NumberLineViewProps): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const svg = useRef<SVGSVGElement | null>(null);
  const scale = useLineScale(svg);
  const group = useId();
  const positions = answer?.positions ?? {};

  // The next thing worth a tap: whichever item is not yet placed. Resuming a
  // draft with some items already down starts the palette on the one still
  // needing attention rather than back at the first row.
  const [active, setActive] = useState<string | undefined>(
    () => data.items.find((item) => positions[item.id] === undefined)?.id ?? data.items[0]?.id,
  );
  const [announcement, setAnnouncement] = useState("");

  // The drag lives in a ref, not in state, and a counter triggers the
  // redraw — the same gesture pattern as task-drag-drop's `DragCanvas`: a
  // pointer gesture can deliver press, move and release within one frame,
  // and reading a ref means `pointerup` always sees what `pointerdown` just
  // wrote rather than whatever render happened to run in between.
  const dragRef = useRef<Drag | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  const live = Boolean(onPlace) && !readonly;
  const ticks = ticksFor(data);

  const clientXToValue = (clientX: number): number | undefined => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return undefined;
    const viewX = ((clientX - box.left) / box.width) * VIEW_WIDTH;
    return viewToValue(data, viewX);
  };

  /** The one place a placement is ever written back, so every gesture —
   *  tap, drag, arrow key — reports the same way and snaps the same way. */
  const place = (item: Item, raw: number, verb: "placed" | "moved") => {
    if (!onPlace) return;
    const value = snapValue(data, raw);
    onPlace(item.id, value);
    setAnnouncement(t(verb, { label: item.label, value: formatValue(value) }));
    if (verb === "placed") {
      // Moves the palette on to whatever is still open, so placing a run of
      // values does not mean reselecting a chip after every single one.
      const next = data.items.find(
        (candidate) => candidate.id !== item.id && positions[candidate.id] === undefined,
      );
      if (next) setActive(next.id);
    }
  };

  const placeAtPointer = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!live || !active) return;
    const item = data.items.find((candidate) => candidate.id === active);
    const raw = clientXToValue(event.clientX);
    if (!item || raw === undefined) return;
    place(item, raw, positions[item.id] === undefined ? "placed" : "moved");
  };

  const startDrag = (event: ReactPointerEvent, item: Item, value: number) => {
    if (!live || event.button !== 0) return;
    // Otherwise this pointerdown also reaches the catcher underneath, which
    // would place the active chip wherever an existing marker was grabbed.
    event.stopPropagation();
    setActive(item.id);
    dragRef.current = { itemId: item.id, startClientX: event.clientX, value, moved: false };
    redraw();
  };

  const moveDrag = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const moved = drag.moved || Math.abs(event.clientX - drag.startClientX) > DRAG_THRESHOLD;
    const raw = clientXToValue(event.clientX);
    const value = raw === undefined ? drag.value : snapValue(data, raw);
    dragRef.current = { ...drag, value, moved };
    redraw();
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    redraw();
    // Under the threshold this was a tap that only meant "select this marker
    // again", which `startDrag` already did — nothing here to write back.
    if (!drag || !drag.moved) return;
    const item = data.items.find((candidate) => candidate.id === drag.itemId);
    if (item) place(item, drag.value, "moved");
  };

  // The window sees the whole gesture: the pointer leaves a 9-unit dot
  // almost immediately, and a release outside the page never reaches it.
  usePointerDrag(moveDrag, endDrag);

  /** Left/Right by the snap step, Shift for a whole major tick, Home/End to
   *  the ends — the keyboard's own way of doing what a drag does. */
  const nudge = (event: ReactKeyboardEvent, item: Item, value: number) => {
    if (!live) return;
    const step = event.shiftKey ? data.tickStep : keyboardStepFor(data);
    let next: number | undefined;
    if (event.key === "ArrowLeft") next = value - step;
    else if (event.key === "ArrowRight") next = value + step;
    else if (event.key === "Home") next = data.min;
    else if (event.key === "End") next = data.max;
    if (next === undefined) return;
    event.preventDefault();
    place(item, next, "moved");
  };

  const placedMarkers = data.items.flatMap((item) => {
    const dragging = dragRef.current?.itemId === item.id;
    const value = dragging ? dragRef.current!.value : positions[item.id];
    return value === undefined ? [] : [{ item, value }];
  });

  const lanes = stackLabels(
    placedMarkers.map(({ item, value }) => ({ id: item.id, view: valueToView(data, value) })),
    LABEL_MIN_GAP,
  );

  return (
    <div className="bitflow-number-line">
      {live && (
        <div
          className="bitflow-number-line-palette"
          role="radiogroup"
          aria-label={t("paletteLabel")}
        >
          {data.items.map((item) => {
            const placedValue = positions[item.id];
            return (
              <label key={item.id} className="bitflow-number-line-chip">
                <input
                  type="radio"
                  name={group}
                  className="bitflow-visually-hidden"
                  checked={active === item.id}
                  onChange={() => setActive(item.id)}
                  onKeyDown={(event) => {
                    // Places an unplaced item at the middle of the line —
                    // the one thing a pointer cannot do without a target to
                    // tap, so the keyboard gets its own way in.
                    if (event.key !== "Enter" || placedValue !== undefined) return;
                    event.preventDefault();
                    place(item, (data.min + data.max) / 2, "placed");
                  }}
                />
                <span>{item.label}</span>
                {placedValue !== undefined && (
                  <span className="bitflow-visually-hidden">
                    {" "}
                    {t("placedSuffix", { value: formatValue(placedValue) })}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      <svg
        ref={svg}
        className="bitflow-number-line-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        // A group, not an image: the sliders on it are controls, and the
        // children of an image are presentational to assistive technology.
        role="group"
        aria-label={t("diagramLabel")}
        // Read by the stylesheet for tick-label font size and marker outline
        // width — a fallback of 1 is what a host without a ResizeObserver
        // (jsdom included) leaves it at.
        style={{ "--bitflow-number-line-scale": scale } as CSSProperties}
      >
        <line
          className="bitflow-number-line-axis"
          x1={MARGIN.left}
          x2={VIEW_WIDTH - MARGIN.right}
          y1={LINE_Y}
          y2={LINE_Y}
        />

        <g className="bitflow-number-line-ticks-minor">
          {ticks.minor.map((tick) => {
            const x = valueToView(data, tick);
            return (
              <line key={`minor-${tick}`} x1={x} x2={x} y1={LINE_Y - MINOR_TICK_HALF} y2={LINE_Y + MINOR_TICK_HALF} />
            );
          })}
        </g>

        <g className="bitflow-number-line-ticks-major">
          {ticks.major.map((tick) => {
            const x = valueToView(data, tick);
            return (
              <line key={`major-${tick}`} x1={x} x2={x} y1={LINE_Y - MAJOR_TICK_HALF} y2={LINE_Y + MAJOR_TICK_HALF} />
            );
          })}
        </g>

        {data.labelTicks && (
          <g className="bitflow-number-line-tick-labels">
            {ticks.major.map((tick) => (
              <text
                key={`label-${tick}`}
                x={valueToView(data, tick)}
                y={LINE_Y + MAJOR_TICK_HALF + 10 + 20 * scale}
                textAnchor="middle"
              >
                {formatValue(tick)}
              </text>
            ))}
          </g>
        )}

        {/* Placing lives on a catcher under everything else, so a gesture
            that starts on an existing marker (which sits on top of it) is
            free to be a drag on that marker instead of a new placement. */}
        {live && (
          <rect
            x={MARGIN.left}
            y={LINE_Y - CATCH_HALF}
            width={PLOT_WIDTH}
            height={CATCH_HALF * 2}
            fill="transparent"
            className="bitflow-number-line-catcher"
            onClick={placeAtPointer}
          />
        )}

        {/* The answer key, drawn once the task is marked: a dashed pointer
            at the position a placement is actually measured against, so a
            near miss reads as a near miss and not a mystery. */}
        {states &&
          data.items.map((item) => (
            <g
              key={`answer-${item.id}`}
              className="bitflow-number-line-answer"
              transform={`translate(${valueToView(data, item.value)} ${LINE_Y}) scale(${scale})`}
            >
              <title>{t("correctValue", { value: formatValue(item.value) })}</title>
              <line x1={0} y1={-18} x2={0} y2={18} />
            </g>
          ))}

        {placedMarkers.map(({ item, value }) => {
          const state = states?.[item.id];
          const view = valueToView(data, value);
          const lane = lanes[item.id] ?? 0;
          const classes = ["bitflow-number-line-dot"];
          if (active === item.id) classes.push("bitflow-number-line-dot-active");
          if (state) classes.push(`bitflow-number-line-dot-${state}`);

          return (
            <g
              key={item.id}
              className="bitflow-number-line-marker"
              transform={`translate(${view} ${LINE_Y}) scale(${scale})`}
            >
              <g
                className="bitflow-number-line-label"
                transform={`translate(0 ${-(LABEL_BASE + lane * LABEL_LANE)})`}
              >
                <text>{item.label}</text>
              </g>

              <circle r={MARKER_R} className={classes.join(" ")} />

              {state && (
                <text
                  className={`bitflow-number-line-verdict bitflow-number-line-verdict-${state}`}
                  x={MARKER_R + 10}
                  y={-(MARKER_R + 6)}
                >
                  {state === "correct" ? "✓" : "✗"}
                </text>
              )}

              {live && (
                <circle
                  r={HIT_RADIUS}
                  className="bitflow-number-line-hit"
                  role="slider"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-valuemin={data.min}
                  aria-valuemax={data.max}
                  aria-valuenow={value}
                  aria-valuetext={formatValue(value)}
                  onPointerDown={(event) => startDrag(event, item, value)}
                  onKeyDown={(event) => nudge(event, item, value)}
                  onClick={(event) => {
                    // Never a placement of its own — only ever a re-select,
                    // which `startDrag` already performed on the way down.
                    event.stopPropagation();
                    setActive(item.id);
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("itemsLegend")}</legend>
        {data.items.map((item) => {
          const value = positions[item.id];
          const state = states?.[item.id];
          return (
            <div key={item.id} className="bitflow-number-line-row">
              <span className="bitflow-number-line-row-label">
                {value === undefined
                  ? t("itemRowUnplaced", { label: item.label })
                  : t("itemRowPlaced", { label: item.label, value: formatValue(value) })}
              </span>
              {state && (
                <span
                  className={`bitflow-number-line-badge bitflow-number-line-badge-${state}`}
                  aria-hidden="true"
                >
                  {state === "correct" ? "✓" : "✗"}
                </span>
              )}
              {state && <span className="bitflow-visually-hidden">{t(state)}</span>}
              {state === "wrong" && (
                <span className="bitflow-text-muted">
                  {t("correctValue", { value: formatValue(item.value) })}
                </span>
              )}
            </div>
          );
        })}
      </fieldset>

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
