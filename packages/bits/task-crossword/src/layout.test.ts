import { describe, expect, it } from "vitest";
import { gridOf } from "./grid";
import { layout } from "./layout";
import { DataSchema, cellsOf, lettersOf, type Word } from "./schema";

const words = (...answers: string[]): Word[] =>
  answers.map((answer, index) => ({
    id: `w${index}`,
    clue: `Clue ${index + 1}`,
    answer,
    row: 0,
    column: 0,
    orientation: "across" as const,
  }));

/** Every square a set of placed words covers, and what it wants there. */
const squares = (placed: Word[]) => {
  const map = new Map<string, string[]>();
  for (const word of placed) {
    const letters = lettersOf(word.answer);
    cellsOf(word).forEach((cell, index) => {
      const key = `${cell.row},${cell.column}`;
      map.set(key, [...(map.get(key) ?? []), letters[index]]);
    });
  }
  return map;
};

describe("layout", () => {
  it("crosses every word into the grid", () => {
    const { words: placed, unplaced } = layout(
      words("CROSSWORD", "WORD", "ROW", "SWORD", "DOWN"),
    );

    expect(unplaced).toEqual([]);
    // Both directions are used, or it is a list rather than a crossword.
    expect(new Set(placed.map((word) => word.orientation))).toEqual(
      new Set(["across", "down"]),
    );
  });

  it("agrees with itself wherever two words cross", () => {
    const { words: placed } = layout(words("CROSSWORD", "WORD", "ROW", "SWORD"));

    for (const [, letters] of squares(placed)) {
      expect(new Set(letters).size).toBe(1);
    }
  });

  it("passes its own validation", () => {
    const { words: placed } = layout(words("CROSSWORD", "WORD", "ROW", "SWORD"));

    // The generator and the schema have to agree about what a crossword is.
    const parsed = DataSchema.safeParse({ words: placed });
    expect(parsed.error?.issues ?? []).toEqual([]);
  });

  it("lays the same words out the same way every time", () => {
    const answers = ["PYTHON", "TYPE", "LOOP", "OBJECT", "NODE"];
    const once = layout(words(...answers));
    const again = layout(words(...answers));

    // A file that changed each time it was saved would be unreviewable.
    expect(again.words).toEqual(once.words);
  });

  it("does not depend on the order the author happened to type them", () => {
    const first = layout(words("CROSSWORD", "WORD", "ROW", "SWORD"));
    const shuffled = layout(
      [...words("CROSSWORD", "WORD", "ROW", "SWORD")].reverse(),
    );

    const places = (result: { words: Word[] }) =>
      Object.fromEntries(
        result.words.map((word) => [
          word.answer,
          `${word.row},${word.column},${word.orientation}`,
        ]),
      );
    expect(places(shuffled)).toEqual(places(first));
  });

  it("starts the grid at the top-left corner", () => {
    const { words: placed } = layout(words("CROSSWORD", "WORD", "ROW", "SWORD"));

    expect(Math.min(...placed.map((word) => word.row))).toBe(0);
    expect(Math.min(...placed.map((word) => word.column))).toBe(0);
  });

  it("never lays two words shoulder to shoulder", () => {
    const { words: placed } = layout(
      words("CROSSWORD", "WORD", "ROW", "SWORD", "DOWN", "SNOW"),
    );
    const grid = gridOf(DataSchema.parse({ words: placed }));

    // A square with an across word and no down word must not have a
    // neighbour above or below, or the two words spell something together
    // that nobody wrote a clue for.
    for (const cell of grid.cells.values()) {
      if (cell.across && !cell.down) {
        expect(grid.cells.has(`${cell.row - 1},${cell.column}`)).toBe(false);
        expect(grid.cells.has(`${cell.row + 1},${cell.column}`)).toBe(false);
      }
      if (cell.down && !cell.across) {
        expect(grid.cells.has(`${cell.row},${cell.column - 1}`)).toBe(false);
        expect(grid.cells.has(`${cell.row},${cell.column + 1}`)).toBe(false);
      }
    }
  });

  it("never writes one word along the length of another", () => {
    const { words: placed } = layout(words("CROSSWORD", "WORD", "SWORD", "ROW"));

    // SWORD laid over WORD agrees about every letter, so letters alone do not
    // catch it: a square already used by a word running the same way is not a
    // crossing.
    for (const word of placed) {
      const others = placed.filter(
        (other) => other.id !== word.id && other.orientation === word.orientation,
      );
      const own = new Set(
        cellsOf(word).map((cell) => `${cell.row},${cell.column}`),
      );
      for (const other of others) {
        for (const cell of cellsOf(other)) {
          expect(own.has(`${cell.row},${cell.column}`)).toBe(false);
        }
      }
    }
  });

  it("hands back a word it could not hang anywhere", () => {
    const { unplaced } = layout(words("AAAA", "BBBB"));

    // Nothing in common, so there is no square the second can cross at.
    expect(unplaced.map((word) => word.answer)).toEqual(["BBBB"]);
  });

  it("parks a word it could not place clear of the grid", () => {
    const { words: placed } = layout(words("AAAA", "BBBB"));
    const covered = squares(placed);

    // Left where it was, it would land on top of the first word, and the
    // author would be told their words overlap when the truth is that one of
    // them does not fit.
    for (const [, letters] of covered) {
      expect(new Set(letters).size).toBe(1);
    }
  });

  it("comes back to a word that would not fit until more letters were down", () => {
    // TIN shares nothing with ZEBRA, and only reaches the grid through PAINT,
    // which is placed after it in the longest-first order.
    const { unplaced } = layout(words("ZEBRA", "TIN", "PAINT"));

    expect(unplaced).toEqual([]);
  });

  it("tries every word as the starting one rather than only the longest", () => {
    const { unplaced } = layout(
      words("ALGORITHM", "LOOP", "BINARY", "MEMORY", "INPUT", "BUG"),
    );

    // Starting from the longest answer alone leaves LOOP and BUG homeless.
    expect(unplaced).toEqual([]);
  });
});
