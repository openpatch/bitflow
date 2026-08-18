import { cellKey, cellsOf, lettersOf, type Data, type Word } from "./schema";

/** One square of the grid that a word passes through. */
export type Cell = {
  row: number;
  column: number;
  /** The letter that belongs here, uppercase. */
  solution: string;
  /**
   * The clue number printed in the corner, when a word starts here. Standard
   * crossword numbering: read the grid like a page and count the squares that
   * begin a word, across and down sharing one sequence.
   */
  number?: number;
  /** The words passing through, at most one across and one down. */
  across?: string;
  down?: string;
};

/** A word with its number and its place in the clue list. */
export type NumberedWord = Word & { number: number; letters: string[] };

export type Grid = {
  rows: number;
  columns: number;
  cells: Map<string, Cell>;
  words: NumberedWord[];
};

/**
 * The grid the words describe.
 *
 * Derived rather than stored: the words already say everything, and a second
 * copy of the same facts is a second thing to get out of step. Positions are
 * shifted so the puzzle starts at the top-left corner however the author (or
 * the generator) happened to number the rows.
 */
export const gridOf = (data: Data): Grid => {
  const placed = data.words.filter((word) => lettersOf(word.answer).length > 0);
  if (placed.length === 0) {
    return { rows: 0, columns: 0, cells: new Map(), words: [] };
  }

  const cellsPerWord = placed.map(cellsOf);
  const all = cellsPerWord.flat();
  const top = Math.min(...all.map((cell) => cell.row));
  const left = Math.min(...all.map((cell) => cell.column));

  const cells = new Map<string, Cell>();
  placed.forEach((word, index) => {
    const letters = lettersOf(word.answer);
    cellsPerWord[index].forEach((at, position) => {
      const row = at.row - top;
      const column = at.column - left;
      const key = cellKey(row, column);
      const cell = cells.get(key) ?? { row, column, solution: letters[position] };
      cell[word.orientation] = word.id;
      cells.set(key, cell);
    });
  });

  const rows = Math.max(...[...cells.values()].map((cell) => cell.row)) + 1;
  const columns = Math.max(...[...cells.values()].map((cell) => cell.column)) + 1;

  // Numbered in reading order, so the clue list runs the way the grid does.
  const starts = placed
    .map((word, index) => ({
      word,
      row: cellsPerWord[index][0].row - top,
      column: cellsPerWord[index][0].column - left,
      letters: lettersOf(word.answer),
    }))
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const numbers = new Map<string, number>();
  const words: NumberedWord[] = [];
  for (const start of starts) {
    const key = cellKey(start.row, start.column);
    // Two words starting on the same square share its number: that is the
    // whole point of "5 across" and "5 down".
    const number = numbers.get(key) ?? numbers.size + 1;
    numbers.set(key, number);
    const cell = cells.get(key);
    if (cell) cell.number = number;
    words.push({
      ...start.word,
      row: start.row,
      column: start.column,
      number,
      letters: start.letters,
    });
  }

  return { rows, columns, cells, words };
};

/** The clue list, split the way a crossword prints it. */
export const cluesOf = (grid: Grid) => ({
  across: grid.words.filter((word) => word.orientation === "across"),
  down: grid.words.filter((word) => word.orientation === "down"),
});

/** The cells of one word, in the order it is written. */
export const pathOf = (grid: Grid, wordId: string): Cell[] => {
  const word = grid.words.find((candidate) => candidate.id === wordId);
  if (!word) return [];
  return word.letters
    .map((_letter, index) =>
      grid.cells.get(
        cellKey(
          word.row + (word.orientation === "down" ? index : 0),
          word.column + (word.orientation === "across" ? index : 0),
        ),
      ),
    )
    .filter((cell): cell is Cell => cell !== undefined);
};
