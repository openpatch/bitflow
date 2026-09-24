import type { Axis } from "./schema";

/** A curve, broken into runs that are each safe to draw as one continuous
 *  line — see `sampleCurve`. */
export type CurvePoint = { x: number; y: number };
export type CurveSegment = CurvePoint[];

/**
 * Samples `fn` across the x‑axis at `samples` evenly spaced points, splitting
 * into a new segment wherever the result is not finite. An asymptote or a
 * domain error (the square root of a negative number, say) is a gap in the
 * graph, not a line rocketing off it — the same reasoning `parseExpression`
 * itself uses for `notFinite`, applied to a whole curve instead of one point.
 *
 * `y` is clamped to a wide band around the y‑axis before it comes back, not to
 * the axis itself: a `shown` curve is allowed to leave the visible range —
 * `PlotView` clips it at draw time with an SVG `clipPath` — but a genuine
 * blow-up approaching an asymptote (1e300, say) would otherwise hand the
 * renderer coordinates so large the browser stops drawing the path at all.
 * Three times the axis's own span in either direction is comfortably past
 * anything a clip needs to cut off, and comfortably inside what SVG draws
 * reliably.
 */
export const sampleCurve = (
  fn: (x: number) => number,
  axisX: Pick<Axis, "min" | "max">,
  axisY: Pick<Axis, "min" | "max">,
  samples = 200,
): CurveSegment[] => {
  const segments: CurveSegment[] = [];
  let current: CurveSegment = [];
  const spanY = axisY.max - axisY.min || 1;
  const low = axisY.min - spanY * 3;
  const high = axisY.max + spanY * 3;

  for (let index = 0; index <= samples; index++) {
    const x = axisX.min + ((axisX.max - axisX.min) * index) / samples;
    const y = fn(x);
    if (Number.isFinite(y)) {
      current.push({ x, y: Math.min(high, Math.max(low, y)) });
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
};
