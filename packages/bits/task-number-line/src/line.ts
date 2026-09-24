import type { Data, SnapMode } from "./schema";

/**
 * The diagram's own fixed coordinate system, on the same reasoning as
 * task-point-plot's `plot.ts`: a viewBox that scales as one thing, so a
 * pointer position inside the rendered element maps onto a position on the
 * line with nothing more than the element's own width.
 */
export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 220;

/** Room outside the line for its end labels and the tick labels below it. */
export const MARGIN = { left: 48, right: 48 };
export const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;

/** The line's own vertical position; everything else is measured from it. */
export const LINE_Y = 132;

/** The span the line covers. Never zero: a form mid-edit — max typed before
 *  min was fixed up — would otherwise divide by it while drawing the preview. */
const spanOf = (data: Pick<Data, "min" | "max">): number => data.max - data.min || 1;

/** A value in line units, as a viewBox x. Left to right, the same as reading order. */
export const valueToView = (data: Pick<Data, "min" | "max">, value: number): number =>
  MARGIN.left + ((value - data.min) / spanOf(data)) * PLOT_WIDTH;

/** The inverse of `valueToView`. */
export const viewToValue = (data: Pick<Data, "min" | "max">, viewX: number): number =>
  data.min + ((viewX - MARGIN.left) / PLOT_WIDTH) * spanOf(data);

/**
 * Spacing between the finest ticks the line draws — a major tick's own
 * spacing divided into `minorTicks + 1` parts. With no minor ticks at all
 * this is exactly `tickStep`, which is what makes `"minor"` and `"major"`
 * the same snap and the same keyboard step when there is nothing finer drawn.
 */
export const minorStepFor = (data: Pick<Data, "tickStep" | "minorTicks">): number =>
  data.minorTicks > 0 ? data.tickStep / (data.minorTicks + 1) : data.tickStep;

/** The step a placement snaps to, or `undefined` for no snapping at all. */
export const snapStepFor = (
  data: Pick<Data, "tickStep" | "minorTicks">,
  snap: SnapMode,
): number | undefined => {
  if (snap === "none") return undefined;
  return snap === "major" ? data.tickStep : minorStepFor(data);
};

/** The step the arrow keys move a marker by. Falls back to the finest tick
 *  spacing when nothing is set to snap to — a slider with no rest position
 *  still has to move by something sensible. */
export const keyboardStepFor = (data: Data): number =>
  snapStepFor(data, data.snap) ?? minorStepFor(data);

/** A value's floor of precision, so summed floating-point noise (`0.1 + 0.2`
 *  style) never survives into a stored position or a printed one. */
const clean = (value: number): number => Math.round(value * 1e9) / 1e9;

/**
 * A raw pointer or keyboard value, clamped onto the line and snapped to
 * `data.snap`'s step. The one place a placement is ever produced, so the
 * line, the drag and the keyboard all land on exactly the same grid.
 */
export const snapValue = (data: Data, raw: number): number => {
  const clamped = Math.min(Math.max(raw, data.min), data.max);
  const step = snapStepFor(data, data.snap);
  if (!step) return clean(clamped);
  const snapped = data.min + Math.round((clamped - data.min) / step) * step;
  return clean(Math.min(Math.max(snapped, data.min), data.max));
};

export type Ticks = { major: number[]; minor: number[] };

/**
 * The lines the axis draws: major ticks every `tickStep` from `min`, and
 * — if `minorTicks` calls for them — the finer ticks between each pair.
 *
 * Anchored at `min` rather than at the nearest round multiple of `tickStep`:
 * an author who types `-2` to `2` in steps of `1` gets a tick exactly at
 * both ends, which is what "goes from −2 to 2" is supposed to mean. A range
 * that does not divide evenly by its step simply does not get a tick at
 * `max` — the same as a ruler that runs out mid-centimetre.
 */
// The schema keeps a saved document to at most 40 major ticks, but the
// authoring form draws a live preview of whatever is currently typed, which
// is not validated yet. A zero or negative step would loop forever counting
// up to `max`, and a huge range with a tiny step would still hang the tab
// even though it terminates eventually — both are guarded against here
// rather than trusted to the schema, which only ever sees the value after a
// change has already committed.
const MAX_TICKS = 400;

export const ticksFor = (data: Data): Ticks => {
  const { min, max, tickStep } = data;
  if (!(tickStep > 0)) return { major: [min, max].filter(Number.isFinite), minor: [] };

  const EPS = tickStep * 1e-6;
  const major: number[] = [];
  for (let value = min; value <= max + EPS && major.length < MAX_TICKS; value += tickStep) {
    major.push(clean(value));
  }

  const minor: number[] = [];
  if (data.minorTicks > 0) {
    const step = minorStepFor(data);
    for (let value = min; value <= max + EPS && minor.length < MAX_TICKS; value += step) {
      const rounded = clean(value);
      // Only the ticks a major line has not already drawn.
      if (!major.some((tick) => Math.abs(tick - rounded) < EPS)) minor.push(rounded);
    }
  }

  return { major, minor };
};

/** A value, printed without float noise or a needless run of zeroes. */
export const formatValue = (value: number): string => String(clean(value * 1000) / 1000);

/**
 * Which vertical lane each marker's label sits in, so two markers placed
 * close together stack rather than overlap.
 *
 * Greedy, left to right: a label goes in the lowest lane whose last label
 * ends at least `minGap` view units before this one starts. Ties — two
 * markers on the very same tick — fall back to the order they were given in,
 * which callers pass sorted however they want that decided.
 */
export const stackLabels = (
  points: { id: string; view: number }[],
  minGap: number,
): Record<string, number> => {
  const sorted = [...points].sort((a, b) => a.view - b.view);
  const laneEnds: number[] = [];
  const lanes: Record<string, number> = {};

  for (const point of sorted) {
    let lane = 0;
    while (laneEnds[lane] !== undefined && point.view - laneEnds[lane] < minGap) lane++;
    laneEnds[lane] = point.view;
    lanes[point.id] = lane;
  }

  return lanes;
};
