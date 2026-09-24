import type { Axis, Snap } from "./schema";

/**
 * The diagram's own fixed coordinate system, on the same reasoning as
 * task-point-plot's `VIEW_WIDTH`/`VIEW_HEIGHT`: a viewBox that scales as one
 * thing, so a pointer position inside the rendered element maps onto a
 * position inside the plot with nothing more than the element's own width and
 * height, whatever size it is actually drawn at.
 */
export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 640;

/** Room outside the plotted area for axis ticks, their labels and the axis
 *  names, at the size a phone scales them up to (see `usePlotScale` in
 *  `PlotView.tsx`), so none of them run into each other or off the edge. */
export const MARGIN = { top: 24, right: 24, bottom: 100, left: 128 };

export const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
export const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

type MinMax = Pick<Axis, "min" | "max">;

/** The span an axis covers. Never zero: a flat axis would divide by it — the
 *  schema already refuses `max <= min`, so this only guards a document from
 *  somewhere that skipped that check. */
const spanOf = (axis: MinMax): number => axis.max - axis.min || 1;

/** An x in axis units, as a viewBox x. Left to right, the same as reading order. */
export const xToView = (axis: MinMax, x: number): number =>
  MARGIN.left + ((x - axis.min) / spanOf(axis)) * PLOT_WIDTH;

/**
 * A y in axis units, as a viewBox y.
 *
 * Axis units grow upward, the way a plot drawn on paper does; SVG's own y
 * grows downward. This is the one place that flip happens, so everywhere else
 * — knobs, curves, the inverse below — can reason in "up is more" without a
 * second thought.
 */
export const yToView = (axis: MinMax, y: number): number =>
  MARGIN.top + PLOT_HEIGHT - ((y - axis.min) / spanOf(axis)) * PLOT_HEIGHT;

/** The inverse of `xToView`: a viewBox x, as an x in axis units. */
export const xFromView = (axis: MinMax, viewX: number): number =>
  axis.min + ((viewX - MARGIN.left) / PLOT_WIDTH) * spanOf(axis);

/** The inverse of `yToView`. */
export const yFromView = (axis: MinMax, viewY: number): number =>
  axis.min + ((MARGIN.top + PLOT_HEIGHT - viewY) / PLOT_HEIGHT) * spanOf(axis);

/** Kills the float noise (`0.1 + 0.2`-style) that would otherwise survive into
 *  a stored value and print as `3.0000000000000004`. */
export const round9 = (value: number): number => Math.round(value * 1e9) / 1e9;

/**
 * Tick marks at every `step` from `min` to `max` — the author's own choice of
 * spacing, not a fixed count: a 0.5 step wants ten times as many ticks over
 * the same range as a step of 5 does.
 */
export const ticksFor = (axis: Axis): number[] => {
  const step = axis.step > 0 ? axis.step : spanOf(axis);
  const count = Math.max(0, Math.round((axis.max - axis.min) / step));
  return Array.from({ length: count + 1 }, (_, index) => round9(axis.min + index * step));
};

/**
 * The ticks worth a number, when there are too many to print them all.
 *
 * A grid line per step is fine at any density, but a label per step on an
 * axis of fifteen steps, scaled up for a phone, runs the numbers into each
 * other. So beyond `room` labels only every second, fifth or tenth tick is
 * printed — whichever is the first to fit — counted from zero where zero is on
 * the axis, so the labels stay on round numbers.
 */
export const labelledTicks = (ticks: number[], step: number, room: number): number[] => {
  if (ticks.length <= room) return ticks;
  const every = [2, 5, 10, 20, 50].find((n) => Math.ceil(ticks.length / n) <= room) ?? 100;
  const stride = step * every;
  return ticks.filter((tick) => Math.abs(tick / stride - Math.round(tick / stride)) < 1e-9);
};

/** A tick value, printed without float noise or a needless trailing `.0`. */
export const formatTick = (value: number): string => String(Math.round(value * 100) / 100);

/**
 * `count` x positions evenly spread across the whole axis, endpoints
 * included. The default layout for `handles`: the two ends of the visible
 * plot are exactly where a sketch is easiest to get wrong — a vertex just past
 * the edge, the start of an asymptote — so they get a handle each rather than
 * being left implicit.
 */
export const defaultHandles = (axis: MinMax, count = 5): number[] => {
  if (count <= 1) return [round9((axis.min + axis.max) / 2)];
  const span = axis.max - axis.min;
  return Array.from({ length: count }, (_, index) =>
    round9(axis.min + (span * index) / (count - 1)),
  );
};

/**
 * Where an unset handle's knob sits, and the value keyboard focus starts at:
 * zero, if the axis actually contains it, or the axis's own midpoint
 * otherwise. This is only ever a place to draw and start from — a handle at
 * this position is not "set" until the learner actually moves or taps it; see
 * `handleKey` and `handleStates` in `evaluate.ts`.
 */
export const defaultHandleValue = (axis: MinMax): number =>
  axis.min <= 0 && 0 <= axis.max ? 0 : (axis.min + axis.max) / 2;

/**
 * Rounds a y value to whatever the author's `snap` setting allows, then
 * clamps it onto the axis.
 *
 * "half" (the default) rounds to half a grid step: finer than the gridlines
 * the learner sees, coarse enough that a value can still be reached with a
 * handful of key presses. "grid" rounds to a whole step, for a teacher who
 * wants a sketch to land exactly on a labelled line. "none" only clamps —
 * freehand, to whatever precision the pointer or the number field gives.
 */
export const snapValue = (axis: Axis, value: number, snap: Snap): number => {
  const clamped = Math.min(axis.max, Math.max(axis.min, value));
  if (snap === "none") return round9(clamped);
  const unit = snap === "half" ? axis.step / 2 : axis.step;
  if (!(unit > 0)) return round9(clamped);
  const steps = Math.round((clamped - axis.min) / unit);
  return round9(Math.min(axis.max, Math.max(axis.min, axis.min + steps * unit)));
};

/** How far one Up/Down key press moves a knob: half the axis step, so a
 *  handful of presses can reach any "half"-snapped value and still land on
 *  every "grid"-snapped one along the way. `PageUp`/`PageDown` moves five
 *  whole steps, for crossing the plot quickly. */
export const keyboardStep = (axis: Axis): number => axis.step / 2;
export const keyboardPageStep = (axis: Axis): number => axis.step * 5;
