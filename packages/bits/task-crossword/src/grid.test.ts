import { describe, expect, it } from "vitest";
import { cluesOf, gridOf, pathOf } from "./grid";
import { cellKey, DataSchema, type Word } from "./schema";

const words: Word[] = [
  { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
  { id: "b", clue: "A line of seats", answer: "ROW", row: 0, column: 2, orientation: "down" },
];

const grid = (over: Word[] = words) => gridOf(DataSchema.parse({ words: over }));

describe("gridOf", () => {
  it("covers every square a word passes through, and no others", () => {
    expect(grid().cells.size).toBe(6);
    expect(grid().cells.has(cellKey(1, 0))).toBe(false);
  });

  it("knows both words at the square where they cross", () => {
    expect(grid().cells.get(cellKey(0, 2))).toMatchObject({
      solution: "R",
      across: "a",
      down: "b",
    });
  });

  it("shifts the puzzle into the corner", () => {
    // The author's numbering is their business; the grid always starts at 0,0.
    const away = words.map((word) => ({
      ...word,
      row: word.row + 7,
      column: word.column + 4,
    }));

    expect(grid(away).rows).toBe(3);
    expect(grid(away).columns).toBe(4);
    expect(grid(away).cells.has(cellKey(0, 0))).toBe(true);
  });

  it("numbers the squares that start a word, in reading order", () => {
    const numbered = [...grid().cells.values()]
      .filter((cell) => cell.number !== undefined)
      .map((cell) => [cell.number, cell.row, cell.column]);

    expect(numbered).toEqual([
      [1, 0, 0],
      [2, 0, 2],
    ]);
  });

  it("gives two words starting on one square the same number", () => {
    const shared: Word[] = [
      { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
      { id: "b", clue: "Not shut", answer: "WIDE", row: 0, column: 0, orientation: "down" },
    ];

    // That is what "1 across" and "1 down" means.
    expect(grid(shared).words.map((word) => word.number)).toEqual([1, 1]);
  });

  it("has nothing to show for a crossword with no words", () => {
    // Parsed with marking off, since an empty crossword is not a valid one.
    const empty = DataSchema.parse({ words: [], evaluation: { mode: "skip" } });
    expect(gridOf(empty)).toMatchObject({
      rows: 0,
      columns: 0,
    });
  });
});

describe("cluesOf", () => {
  it("splits the list the way a crossword prints it", () => {
    const clues = cluesOf(grid());

    expect(clues.across.map((word) => word.answer)).toEqual(["WORD"]);
    expect(clues.down.map((word) => word.answer)).toEqual(["ROW"]);
  });
});

describe("pathOf", () => {
  it("walks a word in the order it is written", () => {
    expect(pathOf(grid(), "b").map((cell) => [cell.row, cell.column])).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
  });

  it("has no path for a word that is not there", () => {
    expect(pathOf(grid(), "gone")).toEqual([]);
  });
});
