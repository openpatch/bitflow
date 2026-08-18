import type { Hotspot } from "./schema";

export type Box = { x: number; y: number; width: number; height: number };

/**
 * Whether a point falls inside a region, in the picture's own 0..1 space.
 *
 * A rectangle is the box; an ellipse is the one drawn inside the same box.
 * Both are placed by the same four numbers, which is what lets the editor draw
 * either by dragging one rectangle.
 */
export const contains = (
  hotspot: Hotspot,
  point: { x: number; y: number },
): boolean => {
  if (hotspot.width <= 0 || hotspot.height <= 0) return false;

  if (hotspot.shape === "rect") {
    return (
      point.x >= hotspot.x &&
      point.x <= hotspot.x + hotspot.width &&
      point.y >= hotspot.y &&
      point.y <= hotspot.y + hotspot.height
    );
  }

  // Normalised to the ellipse's own axes, so the test is a unit circle and the
  // picture's proportions never enter into it.
  const dx = (point.x - (hotspot.x + hotspot.width / 2)) / (hotspot.width / 2);
  const dy = (point.y - (hotspot.y + hotspot.height / 2)) / (hotspot.height / 2);
  return dx * dx + dy * dy <= 1;
};

/**
 * The region under a point, or `undefined` for bare picture.
 *
 * Later regions win, so one drawn over another is the one that counts — which
 * is how an author carves an exception out of a larger area.
 */
export const hotspotAt = (
  hotspots: Hotspot[],
  point: { x: number; y: number },
): Hotspot | undefined =>
  [...hotspots].reverse().find((hotspot) => contains(hotspot, point));

/** The middle of a region, which is where a keyboard choice starts from. */
export const centreOf = (box: Box): { x: number; y: number } => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});
