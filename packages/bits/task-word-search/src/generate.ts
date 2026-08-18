import {
  cellKey,
  DIRECTIONS,
  lettersOf,
  type Direction,
  type Word,
} from "./schema";

/**
 * Builds the grid: the words placed in it, and letters filling the rest.
 *
 * H5P does this in the learner's browser each time. Doing it in the editor
 * instead means the author sees the puzzle they are setting, two learners get
 * the same one, and the file says where every word lies — which is what lets a
 * found word be judged by where it was dragged rather than by what the letters
 * spell.
 *
 * Everything is settled by rule or by a seeded generator, so the same words
 * and the same size always produce the same grid.
 */

export type GenerateOptions = {
  rows: number;
  columns: number;
  /** Which of the eight runs the author will allow. */
  directions: Direction[];
  /** Seeds the filler letters. Same seed, same puzzle. */
  seed?: string;
};

export type Generated = {
  rows: number;
  columns: number;
  letters: string;
  words: Word[];
  /** Words there was no room for, left for the author to deal with. */
  unplaced: Word[];
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * A small deterministic generator (mulberry32) seeded from a string.
 *
 * Filler letters have to be arbitrary but not unpredictable: a puzzle that
 * comes out differently every time it is saved cannot be reviewed, printed or
 * argued with.
 */
export const seededRandom = (seed: string): (() => number) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const generate = (
  words: Word[],
  { rows, columns, directions, seed }: GenerateOptions,
): Generated => {
  // Seeded from the puzzle rather than from the typing: the same words in a
  // different order are the same puzzle, and should come out the same way.
  const random = seededRandom(
    seed ??
      [...words.map((word) => word.text)].sort().join("|") + `|${rows}x${columns}`,
  );
  const allowed = directions.length > 0 ? directions : (["east"] as Direction[]);

  const grid = new Map<string, string>();
  const placed: Word[] = [];
  const unplaced: Word[] = [];

  // Longest first: the hardest to fit goes in while there is most room. Ties
  // by the word itself rather than by its id, since the id is an artefact of
  // editing — two authors who type the same words in a different order are
  // setting the same puzzle and should get the same grid.
  const queue = [...words]
    .map((word) => ({ word, letters: lettersOf(word.text) }))
    .filter((entry) => entry.letters.length > 1)
    .sort(
      (a, b) =>
        b.letters.length - a.letters.length ||
        a.letters.join("").localeCompare(b.letters.join("")),
    );

  for (const entry of queue) {
    const at = bestPlacement(grid, entry.letters, { rows, columns }, allowed, random);
    if (!at) {
      unplaced.push(entry.word);
      continue;
    }
    const step = DIRECTIONS[at.direction];
    entry.letters.forEach((letter, index) => {
      grid.set(cellKey(at.row + step.row * index, at.column + step.column * index), letter);
    });
    placed.push({ ...entry.word, ...at });
  }

  const letters = fill(grid, { rows, columns }, placed, random);

  return {
    rows,
    columns,
    letters,
    // Returned in the author's own order, so the list they are editing does
    // not rearrange itself under them.
    words: words.map(
      (word) => placed.find((candidate) => candidate.id === word.id) ?? word,
    ),
    unplaced,
  };
};

/**
 * Where to put a word: among the positions it fits, the one that shares the
 * most letters with what is already down.
 *
 * Overlapping is what makes a word search hard — a word that shares no letter
 * with any other sits in the grid like a highlighted line.
 */
const bestPlacement = (
  grid: Map<string, string>,
  letters: string[],
  size: { rows: number; columns: number },
  directions: Direction[],
  random: () => number,
): { row: number; column: number; direction: Direction } | undefined => {
  const candidates: {
    at: { row: number; column: number; direction: Direction };
    overlap: number;
  }[] = [];

  for (const direction of directions) {
    const step = DIRECTIONS[direction];
    for (let row = 0; row < size.rows; row++) {
      for (let column = 0; column < size.columns; column++) {
        const overlap = overlapAt(grid, letters, { row, column }, step, size);
        if (overlap === null) continue;
        candidates.push({ at: { row, column, direction }, overlap });
      }
    }
  }

  if (candidates.length === 0) return undefined;

  const most = Math.max(...candidates.map((candidate) => candidate.overlap));
  const best = candidates.filter((candidate) => candidate.overlap === most);
  return best[Math.floor(random() * best.length)].at;
};

/** How many letters a placement would share, or `null` if it does not fit. */
const overlapAt = (
  grid: Map<string, string>,
  letters: string[],
  start: { row: number; column: number },
  step: { row: number; column: number },
  size: { rows: number; columns: number },
): number | null => {
  let overlap = 0;
  for (let index = 0; index < letters.length; index++) {
    const row = start.row + step.row * index;
    const column = start.column + step.column * index;
    if (row < 0 || column < 0 || row >= size.rows || column >= size.columns) {
      return null;
    }
    const taken = grid.get(cellKey(row, column));
    if (taken === undefined) continue;
    if (taken !== letters[index]) return null;
    overlap++;
  }
  return overlap;
};

/**
 * Fills the empty squares, taking care not to spell a hidden word by accident.
 *
 * A filler letter completing one of the words elsewhere in the grid makes a
 * correct-looking find that would be marked wrong — the one thing a learner
 * cannot argue with and cannot learn from. Each square is rolled again until
 * it spells nothing; after enough tries it settles for the least bad letter,
 * because a grid that never finishes is worse than a rare coincidence.
 */
const fill = (
  grid: Map<string, string>,
  size: { rows: number; columns: number },
  placed: Word[],
  random: () => number,
): string => {
  const targets = placed.map((word) => lettersOf(word.text).join(""));
  const reversed = targets.map((word) => [...word].reverse().join(""));
  const hunted = [...new Set([...targets, ...reversed])];

  for (let row = 0; row < size.rows; row++) {
    for (let column = 0; column < size.columns; column++) {
      const key = cellKey(row, column);
      if (grid.has(key)) continue;
      for (let attempt = 0; attempt < ALPHABET.length; attempt++) {
        const letter = ALPHABET[Math.floor(random() * ALPHABET.length)];
        grid.set(key, letter);
        if (!spellsAnything(grid, size, { row, column }, hunted)) break;
      }
    }
  }

  let letters = "";
  for (let row = 0; row < size.rows; row++) {
    for (let column = 0; column < size.columns; column++) {
      letters += grid.get(cellKey(row, column)) ?? "A";
    }
  }
  return letters;
};

/** Whether any run through this square now spells one of the hidden words. */
const spellsAnything = (
  grid: Map<string, string>,
  size: { rows: number; columns: number },
  at: { row: number; column: number },
  hunted: string[],
): boolean => {
  const longest = Math.max(...hunted.map((word) => word.length));

  for (const step of [
    DIRECTIONS.east,
    DIRECTIONS.south,
    DIRECTIONS.southEast,
    DIRECTIONS.southWest,
  ]) {
    // Every run through this square that is short enough to matter, read in
    // one direction only — the reversals are already in the list.
    for (let before = 0; before < longest; before++) {
      let run = "";
      for (let index = -before; index < longest - before; index++) {
        const row = at.row + step.row * index;
        const column = at.column + step.column * index;
        if (row < 0 || column < 0 || row >= size.rows || column >= size.columns) break;
        const letter = grid.get(cellKey(row, column));
        if (letter === undefined) break;
        run += letter;
        if (run.length > 1 && hunted.includes(run)) return true;
      }
    }
  }
  return false;
};
