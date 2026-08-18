import { describe, expect, it } from "vitest";
import { cellsBetween, cellsOf, DataSchema, letterAt, lettersOf } from "./schema";

/**
 *   C A T X X
 *   O X X X X
 *   D X X X X
 *   E X X X X
 *   X X X X X
 */
const grid = {
  rows: 5,
  columns: 5,
  letters: ["CATXX", "OXXXX", "DXXXX", "EXXXX", "XXXXX"].join(""),
  words: [
    { id: "cat", text: "CAT", row: 0, column: 0, direction: "east" as const },
    { id: "code", text: "CODE", row: 0, column: 0, direction: "south" as const },
  ],
};

const messages = (over: Record<string, unknown> = {}) =>
  (DataSchema.safeParse({ ...grid, ...over }).error?.issues ?? []).map(
    (issue) => issue.message,
  );

describe("DataSchema", () => {
  it("accepts a grid that spells its words", () => {
    expect(messages()).toEqual([]);
  });

  it("refuses a grid that does not spell a word where it says", () => {
    expect(messages({ words: [{ ...grid.words[0], text: "DOG" }] }).join(" ")).toMatch(
      /the grid spells/i,
    );
  });

  it("refuses a word that runs off the edge", () => {
    expect(
      messages({ words: [{ ...grid.words[0], text: "CATS", column: 3 }] }).join(" "),
    ).toMatch(/off the edge/i);
  });

  it("refuses a grid of the wrong size", () => {
    // The letters and the size have to agree, or every position means
    // something different from what the author intended.
    expect(messages({ columns: 6 }).join(" ")).toMatch(/holds 25 letters but is/i);
  });

  it("refuses a word of one letter", () => {
    expect(messages({ words: [{ ...grid.words[0], text: "C" }] }).join(" ")).toMatch(
      /at least two letters/i,
    );
  });

  it("asks for at least one word", () => {
    expect(messages({ words: [] }).join(" ")).toMatch(/at least one word/i);
  });

  it("refuses to allow no directions at all", () => {
    expect(messages({ directions: [] }).join(" ")).toMatch(/at least one direction/i);
  });

  it("says nothing about the grid when nothing is being marked", () => {
    expect(messages({ words: [], evaluation: { mode: "skip" } })).toEqual([]);
  });
});

describe("cellsOf", () => {
  it("walks a word in the direction it runs", () => {
    expect(cellsOf(grid.words[1])).toEqual([
      { row: 0, column: 0 },
      { row: 1, column: 0 },
      { row: 2, column: 0 },
      { row: 3, column: 0 },
    ]);
  });
});

describe("cellsBetween", () => {
  it("walks a straight run", () => {
    expect(cellsBetween({ row: 0, column: 0, endRow: 2, endColumn: 2 })).toEqual([
      { row: 0, column: 0 },
      { row: 1, column: 1 },
      { row: 2, column: 2 },
    ]);
  });

  it("walks a run backwards", () => {
    expect(cellsBetween({ row: 2, column: 0, endRow: 0, endColumn: 0 })).toEqual([
      { row: 2, column: 0 },
      { row: 1, column: 0 },
      { row: 0, column: 0 },
    ]);
  });

  it("has nothing for a run that is not one of the eight", () => {
    expect(cellsBetween({ row: 0, column: 0, endRow: 1, endColumn: 2 })).toBeUndefined();
  });

  it("has nothing for a run that goes nowhere", () => {
    expect(cellsBetween({ row: 1, column: 1, endRow: 1, endColumn: 1 })).toBeUndefined();
  });
});

describe("letterAt", () => {
  it("reads the grid row by row", () => {
    const data = DataSchema.parse(grid);

    expect(letterAt(data, 0, 1)).toBe("A");
    expect(letterAt(data, 3, 0)).toBe("E");
  });

  it("has nothing off the grid", () => {
    expect(letterAt(DataSchema.parse(grid), 9, 9)).toBeUndefined();
  });
});

describe("lettersOf", () => {
  it("ignores case and spaces, since neither should decide a mark", () => {
    expect(lettersOf(" ice cream ")).toEqual([..."ICECREAM"]);
  });
});
