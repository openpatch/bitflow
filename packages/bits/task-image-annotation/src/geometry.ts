import type { Annotation, Data, Region } from "./schema";

/** A rectangle in the picture's own fractions. */
export type Box = { x: number; y: number; width: number; height: number };

/** A mark as a box: a point is a box with no size, which keeps one code path. */
export const boxOf = (annotation: Annotation): Box => ({
  x: annotation.x,
  y: annotation.y,
  width: annotation.kind === "rect" ? annotation.width : 0,
  height: annotation.kind === "rect" ? annotation.height : 0,
});

export const regionBox = (region: Region): Box =>
  region.kind === "rect"
    ? { x: region.x, y: region.y, width: region.width, height: region.height }
    : {
        x: region.x - region.radius,
        y: region.y - region.radius,
        width: region.radius * 2,
        height: region.radius * 2,
      };

/** The middle of a box, which is what a rectangle answer is judged by. */
export const centreOf = (box: Box) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/**
 * How much two boxes share, as a fraction of everything they cover between
 * them — the Jaccard overlap. 1 is identical, 0 is not touching.
 *
 * The usual measure for "is this box the same box", and the reason it is used
 * rather than "does the middle land inside": a box the right size in the right
 * place and a box covering the whole picture both contain the centre, and only
 * one of them is an answer.
 */
export const overlapOf = (a: Box, b: Box): number => {
  const width = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  const height = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
  const shared = width * height;
  const union = a.width * a.height + b.width * b.height - shared;
  return union <= 0 ? 0 : shared / union;
};

/** Whether a point is inside a circular region — the plain distance test. */
export const within = (
  point: { x: number; y: number },
  region: Region,
): boolean => Math.hypot(point.x - region.x, point.y - region.y) <= region.radius;

/**
 * Whether one mark lands on one region, position only.
 *
 * A point is judged by where it is; a box is judged by how much of the right
 * area it covers — except against a circular region, where a box is taken by
 * its middle, since "outline it" and "mark the spot" are not the same question
 * and a circle has no area to agree with.
 */
export const lands = (
  annotation: Annotation,
  region: Region,
  data: Data,
): boolean => {
  if (region.kind === "circle") {
    const point =
      annotation.kind === "rect" ? centreOf(boxOf(annotation)) : annotation;
    return within(point, region);
  }

  if (annotation.kind === "point") {
    const box = regionBox(region);
    return (
      annotation.x >= box.x &&
      annotation.x <= box.x + box.width &&
      annotation.y >= box.y &&
      annotation.y <= box.y + box.height
    );
  }

  return overlapOf(boxOf(annotation), regionBox(region)) >= data.overlap;
};

/** Whether the learner named the region the way the author accepts. */
export const named = (
  annotation: Annotation,
  region: Region,
  data: Data,
): boolean => {
  if (!data.requireLabel) return true;
  const fold = (value: string) =>
    data.caseSensitive ? value.trim() : value.trim().toLowerCase();
  const given = fold(annotation.label);
  if (given === "") return false;
  return [region.label, ...region.acceptedLabels]
    .map(fold)
    .filter(Boolean)
    .includes(given);
};
