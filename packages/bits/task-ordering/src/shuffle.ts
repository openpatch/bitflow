/**
 * A shuffle that is different for each learner and the same on every reload.
 *
 * The order has to be stable: a learner who reloads halfway through, or comes
 * back to an assessment tomorrow, must not find the items rearranged around
 * whatever they had already moved. Seeding from the attempt gives that for
 * free, and gives two learners different orders without either of them being
 * recorded anywhere.
 */
export const seededShuffle = <T>(values: T[], seed: string): T[] => {
  const random = mulberry32(hash(seed));
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Refuses an order that is already the answer.
 *
 * A shuffle that happens to deal the items in their correct order hands the
 * learner a full mark for doing nothing, and looks like a bug to them. Tried a
 * few times with a varied seed rather than looped forever: with three items
 * there is a one in six chance each time, and giving up eventually is better
 * than not returning.
 */
export const shuffledAwayFrom = <T>(
  values: T[],
  seed: string,
  same: (a: T[], b: T[]) => boolean,
): T[] => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = seededShuffle(values, `${seed}:${attempt}`);
    if (!same(candidate, values)) return candidate;
  }
  // Every attempt matched, which for a real task means one or two items.
  return [...values].reverse();
};

/** FNV-1a, enough to turn an attempt id into a starting number. */
const hash = (text: string): number => {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
};

/** A small, fast generator: no dependency, and the same everywhere. */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
