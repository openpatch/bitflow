export type Box = { x: number; y: number; width: number; height: number };

/**
 * Whether a point falls inside a box, both in the play area's 0..1 space.
 *
 * The whole of the geometry, now that nothing snaps: an element is left where
 * the learner put it, and marking asks only which region its middle is over.
 */
export const inside = (box: Box, point: { x: number; y: number }): boolean =>
  point.x >= box.x &&
  point.x <= box.x + box.width &&
  point.y >= box.y &&
  point.y <= box.y + box.height;
