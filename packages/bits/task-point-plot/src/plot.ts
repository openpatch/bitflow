import type { Axis } from "./schema";

/**
 * The diagram's own fixed coordinate system, on the same reasoning as
 * task-graph-path's `VIEW_WIDTH`/`VIEW_HEIGHT`: a viewBox that scales as one
 * thing, so a circle stays round and a pointer position inside the rendered
 * element maps onto a position inside the plot with nothing more than the
 * element's own width and height.
 */
export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 640;

/** Room outside the plotted area for axis ticks and their labels. */
// Wide enough for the tick labels and the axis names at the size a phone
// scales them up to (see `usePlotScale`), so the two never run into each other
// or off the edge of the picture.
export const MARGIN = { top: 24, right: 24, bottom: 100, left: 128 };

export const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
export const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

/** The span an axis covers. Never zero: a flat axis would divide by it. */
const spanOf = (axis: Axis): number => axis.max - axis.min || 1;

/** An x in axis units, as a viewBox x. Left to right, the same as reading order. */
export const xToView = (axis: Axis, x: number): number =>
  MARGIN.left + ((x - axis.min) / spanOf(axis)) * PLOT_WIDTH;

/**
 * A y in axis units, as a viewBox y.
 *
 * Axis units grow upward, the way every plot drawn on paper does; SVG's own y
 * grows downward. This is the one place that flip happens, so everywhere else
 * — markers, gridlines, the inverse below — can reason in "up is more" without
 * a second thought.
 */
export const yToView = (axis: Axis, y: number): number =>
  MARGIN.top + PLOT_HEIGHT - ((y - axis.min) / spanOf(axis)) * PLOT_HEIGHT;

/** The inverse of `xToView`: a viewBox x, as an x in axis units. */
export const xFromView = (axis: Axis, viewX: number): number =>
  axis.min + ((viewX - MARGIN.left) / PLOT_WIDTH) * spanOf(axis);

/** The inverse of `yToView`. */
export const yFromView = (axis: Axis, viewY: number): number =>
  axis.min + ((MARGIN.top + PLOT_HEIGHT - viewY) / PLOT_HEIGHT) * spanOf(axis);

/**
 * Snaps a value to a tenth of the axis's range: coarse enough that a click in
 * the authoring form lands on a round number instead of whatever pixel it
 * happened to hit, fine enough that ten clicks span the whole axis. A 0–10
 * axis snaps to whole units; a 0–1 axis snaps to 0.1; a −5–5 axis snaps to
 * whole units either side of zero.
 */
export const snapToAxis = (axis: Axis, value: number): number => {
  const step = spanOf(axis) / 10;
  const snapped = Math.round(value / step) * step;
  // Half a step of floating-point noise (`0.1 + 0.2`-style) would otherwise
  // survive into the stored point and print as `3.0000000000000004`.
  return Math.round(snapped * 1e9) / 1e9;
};

/** Evenly spaced tick values from `axis.min` to `axis.max`, `count` of them. */
export const ticksFor = (axis: Axis, count = 5): number[] => {
  const span = axis.max - axis.min;
  if (span <= 0 || count <= 1) return [axis.min];
  return Array.from({ length: count }, (_, index) => axis.min + (span * index) / (count - 1));
};

/** A tick value, printed without float noise or a needless trailing `.0`. */
export const formatTick = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
};
