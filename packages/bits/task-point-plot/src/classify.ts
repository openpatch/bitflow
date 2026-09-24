import type { Point } from "./schema";

/**
 * The two textbook classifiers a scatter plot like this is used to teach, as
 * pure functions over the authored points.
 *
 * Neither is used by `evaluate` — a submitted answer is marked purely against
 * `Point.expected`, the author's own answer key, so an author who writes an
 * `expected` that a real k-nearest-neighbours run would not produce is free to
 * do that (a deliberately tricky point, say) and the learner is still marked
 * against what was actually asked. What these are *for* is the authoring
 * form's "fill the answer key for me" buttons, where running the real
 * algorithm and writing its answer down is exactly the shortcut an author
 * wants.
 *
 * Both measure Euclidean distance in the plot's own axis units. Never pixels:
 * an axis stretched wider than the other on screen must not make one direction
 * count for more than it authored.
 */

type Coordinate = { x: number; y: number };

export const distance = (a: Coordinate, b: Coordinate): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * The class of whichever centroid in `centroids` sits closest to `point`.
 *
 * A centroid without a `class` is ignored — it cannot be the answer to "whose
 * class is this". A distance tie is broken by whichever centroid comes first
 * in `centroids`, so a caller that wants ties broken by class order (as the
 * form does) passes them pre‑sorted by the class's position in `data.classes`;
 * this function itself knows nothing about that order; it only ever looks at
 * the array it was given. `undefined` only when `centroids` has nothing usable
 * in it.
 */
export const nearestCentroid = (
  centroids: Point[],
  point: Coordinate,
): string | undefined => {
  let best: { classId: string; distance: number } | undefined;

  for (const centroid of centroids) {
    if (centroid.class === undefined) continue;
    const d = distance(centroid, point);
    if (best === undefined || d < best.distance) {
      best = { classId: centroid.class, distance: d };
    }
  }

  return best?.classId;
};

/**
 * The majority class among the `k` neighbours in `neighbours` closest to
 * `point`.
 *
 * A neighbour without a `class` cannot vote and is dropped before ranking.
 * Ties are broken twice, both times by array order rather than by a rule this
 * function invents on its own:
 *
 * - two neighbours at the same distance keep whichever order `neighbours` was
 *   given in (a stable sort never reorders equal elements);
 * - two classes with the same vote count are decided by whichever of their
 *   voters is nearest — which, again, only means something once the input
 *   order means something.
 *
 * So "ties broken by class order" is a property of the caller, not of `knn`:
 * the form passes `neighbours` sorted by each point's class's position in
 * `data.classes`, and that is what makes the tie‑break deterministic and
 * documented rather than an accident of `Array.prototype.sort`.
 */
export const knn = (
  neighbours: Point[],
  point: Coordinate,
  k: number,
): string | undefined => {
  const withClass = neighbours.filter(
    (neighbour): neighbour is Point & { class: string } => neighbour.class !== undefined,
  );
  const nearest = [...withClass]
    .sort((a, b) => distance(a, point) - distance(b, point))
    .slice(0, Math.max(0, Math.trunc(k)));

  if (nearest.length === 0) return undefined;

  const votes = new Map<string, number>();
  for (const neighbour of nearest) {
    votes.set(neighbour.class, (votes.get(neighbour.class) ?? 0) + 1);
  }

  let winner: string | undefined;
  let winnerVotes = -1;
  // Walked in nearest‑first order, so the first class to reach the highest
  // vote count is the one whose closest voter is nearest — the tie‑break the
  // doc comment above promises.
  for (const neighbour of nearest) {
    const count = votes.get(neighbour.class) ?? 0;
    if (count > winnerVotes) {
      winnerVotes = count;
      winner = neighbour.class;
    }
  }

  return winner;
};
