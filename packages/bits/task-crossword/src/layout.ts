import { cellKey, lettersOf, type Orientation, type Word } from "./schema";

/**
 * Lays a set of answers out as a crossword.
 *
 * H5P does this in the learner's browser every time the content is opened.
 * Here it runs once, in the editor, and the result is written into the file:
 * the author sees the puzzle they are actually setting, two learners get the
 * same one, and a marker can look at the grid without running anything.
 *
 * The method is the ordinary one — start from one answer, then hang each
 * remaining answer off a letter already on the grid — with every choice
 * settled by a rule rather than by a coin toss, so the same words always come
 * out the same way. Among the legal positions for a word it prefers the one
 * that crosses the most letters, then the one that keeps the grid squarest,
 * so puzzles stay compact instead of sprawling diagonally.
 *
 * Which answer it starts from decides a surprising amount, so it tries every
 * one and keeps the best grid. A teacher who cannot fit their sixth word in
 * has to rewrite the word, and the machine should exhaust the cheap options
 * before asking that of them.
 */

type Placement = { row: number; column: number; orientation: Orientation };
/** What each square holds, and which way the words through it run. */
type Squares = Map<string, { letter: string; across: boolean; down: boolean }>;
type Placed = { word: Word; letters: string[] } & Placement;

export type Layout = {
  /** The words, with a place on the grid. */
  words: Word[];
  /** Words nothing could be hung off, left where they were. */
  unplaced: Word[];
};

const step = (orientation: Orientation) =>
  orientation === "across" ? { row: 0, column: 1 } : { row: 1, column: 0 };

const other = (orientation: Orientation): Orientation =>
  orientation === "across" ? "down" : "across";

export const layout = (words: Word[]): Layout => {
  const usable = words
    .map((word) => ({ word, letters: lettersOf(word.answer) }))
    .filter((entry) => entry.letters.length > 1);

  if (usable.length === 0) return { words, unplaced: [] };

  // Longest first, because a long answer has the most letters to hang the
  // rest off. Ties by id, so the outcome never depends on array order.
  const queue = [...usable].sort(
    (a, b) => b.letters.length - a.letters.length || a.word.id.localeCompare(b.word.id),
  );

  let best: Attempt | undefined;
  for (let seed = 0; seed < queue.length; seed++) {
    const attempt = arrange(queue, seed);
    if (
      !best ||
      attempt.unplaced.length < best.unplaced.length ||
      (attempt.unplaced.length === best.unplaced.length &&
        attempt.area < best.area)
    ) {
      best = attempt;
    }
    if (best.unplaced.length === 0 && seed >= 2) break;
  }

  const { placed, unplaced } = best as Attempt;

  // Shifted so the puzzle starts at the top-left, since hanging words off the
  // first one runs into negative rows and columns as often as not.
  const top = Math.min(...placed.map((entry) => entry.row));
  const left = Math.min(...placed.map((entry) => entry.column));
  const bottom = Math.max(
    ...placed.map(
      (entry) =>
        entry.row +
        (entry.orientation === "down" ? entry.letters.length - 1 : 0),
    ),
  );

  const positions = new Map(
    placed.map((entry) => [
      entry.word.id,
      {
        row: entry.row - top,
        column: entry.column - left,
        orientation: entry.orientation,
      },
    ]),
  );

  /*
   * A word nothing could be hung off is parked on its own row below the grid
   * rather than left where it was. Leaving it would drop it on top of
   * whatever happens to be at those coordinates, and the author would be told
   * their words overlap when the truth is that one of them does not fit.
   */
  unplaced.forEach((word, index) => {
    positions.set(word.id, {
      row: bottom - top + 2 + index,
      column: 0,
      orientation: "across",
    });
  });

  return {
    words: words.map((word) => ({ ...word, ...(positions.get(word.id) ?? {}) })),
    unplaced,
  };
};

type Entry = { word: Word; letters: string[] };
type Attempt = { placed: Placed[]; unplaced: Word[]; area: number };

/** One go at the whole grid, starting from `seed` in the queue. */
const arrange = (queue: Entry[], seed: number): Attempt => {
  const grid: Squares = new Map();
  const placed: Placed[] = [];

  const put = (entry: Entry, at: Placement) => {
    const move = step(at.orientation);
    entry.letters.forEach((letter, index) => {
      const key = cellKey(at.row + move.row * index, at.column + move.column * index);
      const square = grid.get(key) ?? { letter, across: false, down: false };
      square[at.orientation] = true;
      grid.set(key, square);
    });
    placed.push({ ...entry, ...at });
  };

  put(queue[seed], { row: 0, column: 0, orientation: "across" });

  const unplaced: Word[] = [];
  const rest = queue.filter((_entry, index) => index !== seed);

  // A word that will not go anywhere now may go somewhere once more letters
  // are on the grid, so the leftovers are tried again until a pass places
  // nothing new.
  let pending = rest;
  while (pending.length > 0) {
    const stuck: Entry[] = [];
    for (const entry of pending) {
      const at = bestPlacement(grid, placed, entry.letters);
      if (at) put(entry, at);
      else stuck.push(entry);
    }
    if (stuck.length === pending.length) {
      unplaced.push(...stuck.map((entry) => entry.word));
      break;
    }
    pending = stuck;
  }

  const rows = placed.flatMap((entry) => [
    entry.row,
    entry.row + (entry.orientation === "down" ? entry.letters.length - 1 : 0),
  ]);
  const columns = placed.flatMap((entry) => [
    entry.column,
    entry.column + (entry.orientation === "across" ? entry.letters.length - 1 : 0),
  ]);
  const area =
    (Math.max(...rows) - Math.min(...rows) + 1) *
    (Math.max(...columns) - Math.min(...columns) + 1);

  return { placed, unplaced, area };
};

/** The best legal position for `letters`, or nothing if there is none. */
const bestPlacement = (
  grid: Squares,
  placed: Placed[],
  letters: string[],
): Placement | undefined => {
  let best: { at: Placement; crossings: number; spread: number } | undefined;

  for (const anchor of placed) {
    const move = step(anchor.orientation);
    const orientation = other(anchor.orientation);
    const across = step(orientation);

    anchor.letters.forEach((letter, anchorIndex) => {
      letters.forEach((candidate, index) => {
        if (candidate !== letter) return;
        const at = {
          row: anchor.row + move.row * anchorIndex - across.row * index,
          column: anchor.column + move.column * anchorIndex - across.column * index,
          orientation,
        };
        const crossings = fits(grid, letters, at);
        if (crossings === null) return;

        const spread = spreadOf(grid, letters, at);
        // More crossings first — an answer that touches the grid in two
        // places is better locked in — then the squarest grid.
        if (
          !best ||
          crossings > best.crossings ||
          (crossings === best.crossings && spread < best.spread)
        ) {
          best = { at, crossings, spread };
        }
      });
    });
  }

  return best?.at;
};

/**
 * How many letters a placement would cross, or `null` if it is not allowed.
 *
 * The rules are the ones that make a grid readable rather than merely
 * consistent: letters must agree where words cross, a word may not run
 * alongside another (which would spell something nobody clued), and it may
 * not butt up against one end to end.
 */
const fits = (
  grid: Squares,
  letters: string[],
  at: Placement,
): number | null => {
  const move = step(at.orientation);
  const side = step(other(at.orientation));

  const before = cellKey(at.row - move.row, at.column - move.column);
  const after = cellKey(
    at.row + move.row * letters.length,
    at.column + move.column * letters.length,
  );
  if (grid.has(before) || grid.has(after)) return null;

  let crossings = 0;
  for (let index = 0; index < letters.length; index++) {
    const row = at.row + move.row * index;
    const column = at.column + move.column * index;
    const taken = grid.get(cellKey(row, column));

    if (taken !== undefined) {
      if (taken.letter !== letters[index]) return null;
      // A square already used by a word running the same way is not a
      // crossing: it means this word is being laid along another one, which
      // is how SWORD ends up written on top of WORD.
      if (taken[at.orientation]) return null;
      crossings++;
      continue;
    }

    // An empty square with a neighbour to either side would put this word
    // shoulder to shoulder with another one.
    if (
      grid.has(cellKey(row - side.row, column - side.column)) ||
      grid.has(cellKey(row + side.row, column + side.column))
    ) {
      return null;
    }
  }

  return crossings > 0 ? crossings : null;
};

/** How lopsided the grid would be afterwards. Lower is squarer. */
const spreadOf = (
  grid: Squares,
  letters: string[],
  at: Placement,
): number => {
  const move = step(at.orientation);
  const rows = [at.row, at.row + move.row * (letters.length - 1)];
  const columns = [at.column, at.column + move.column * (letters.length - 1)];

  for (const key of grid.keys()) {
    const [row, column] = key.split(",").map(Number);
    rows.push(row);
    columns.push(column);
  }

  const height = Math.max(...rows) - Math.min(...rows) + 1;
  const width = Math.max(...columns) - Math.min(...columns) + 1;
  return height * width + Math.abs(height - width);
};
