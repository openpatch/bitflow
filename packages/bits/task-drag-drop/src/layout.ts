export type Box = { x: number; y: number; width: number; height: number };

/**
 * How much of an element has to be on a region for it to count as there.
 *
 * `touch` is the default because it is what dropping something on a target
 * feels like: the learner aims at a place on the picture, and a rule that
 * refuses an element overlapping the right area by nine tenths teaches them
 * about the rule rather than the subject. `centre` and `fit` are there for
 * tasks where precision *is* the point — placing a city on a map, sizing a
 * label to a part — and the author says which by the region.
 */
export type Tolerance = "touch" | "centre" | "fit";

export const overlapArea = (a: Box, b: Box): number => {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
};

/** Whether a point falls inside a box, both in the play area's 0..1 space. */
export const inside = (box: Box, point: { x: number; y: number }): boolean =>
  point.x >= box.x &&
  point.x <= box.x + box.width &&
  point.y >= box.y &&
  point.y <= box.y + box.height;

/** Whether an element counts as being on a region, by that region's rule. */
export const satisfies = (
  element: Box,
  zone: Box,
  tolerance: Tolerance,
): boolean => {
  if (tolerance === "touch") return overlapArea(element, zone) > 0;

  if (tolerance === "centre") {
    return inside(zone, {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2,
    });
  }

  return (
    element.x >= zone.x &&
    element.y >= zone.y &&
    element.x + element.width <= zone.x + zone.width &&
    element.y + element.height <= zone.y + zone.height
  );
};
