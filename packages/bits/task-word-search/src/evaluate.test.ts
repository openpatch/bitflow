import { describe, expect, it } from "vitest";
import { evaluate, foundWords, outcomes, scoreOf, wordFound } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";

/**
 *   C A T . .
 *   O . . . .
 *   D . . . .
 *   E . . . .
 *   . . . . .
 */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    rows: 5,
    columns: 5,
    letters: ["CATXX", "OXXXX", "DXXXX", "EXXXX", "XXXXX"].join(""),
    words: [
      { id: "cat", text: "CAT", row: 0, column: 0, direction: "east" },
      { id: "code", text: "CODE", row: 0, column: 0, direction: "south" },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const drawn = (...runs: [number, number, number, number][]): Answer => ({
  found: runs.map(([row, column, endRow, endColumn]) => ({
    row,
    column,
    endRow,
    endColumn,
  })),
});

describe("wordFound", () => {
  it("finds a word drawn along it", () => {
    expect(wordFound(data(), { row: 0, column: 0, endRow: 0, endColumn: 2 })?.id).toBe("cat");
  });

  it("finds a word drawn backwards", () => {
    // Reading a word the other way is the same discovery.
    expect(wordFound(data(), { row: 0, column: 2, endRow: 0, endColumn: 0 })?.id).toBe("cat");
  });

  it("finds a word running down", () => {
    expect(wordFound(data(), { row: 0, column: 0, endRow: 3, endColumn: 0 })?.id).toBe("code");
  });

  it("finds nothing for a run that is too short", () => {
    expect(wordFound(data(), { row: 0, column: 0, endRow: 0, endColumn: 1 })).toBeUndefined();
  });

  it("finds nothing for a run that is not straight", () => {
    // Two across and one down is not one of the eight ways a word can run.
    expect(wordFound(data(), { row: 0, column: 0, endRow: 1, endColumn: 2 })).toBeUndefined();
  });

  it("finds nothing for a run that only overlaps a word", () => {
    expect(wordFound(data(), { row: 0, column: 0, endRow: 0, endColumn: 3 })).toBeUndefined();
  });
});

describe("foundWords", () => {
  it("counts a word once however many times it is drawn", () => {
    const twice = drawn([0, 0, 0, 2], [0, 2, 0, 0]);

    expect(foundWords(data(), twice).map((word) => word.id)).toEqual(["cat"]);
  });

  it("ignores a run that found nothing", () => {
    expect(foundWords(data(), drawn([4, 0, 4, 4]))).toEqual([]);
  });
});

describe("scoreOf", () => {
  it("gives a point per word found", () => {
    expect(scoreOf(data(), drawn([0, 0, 0, 2]))).toEqual({ earned: 1, possible: 2 });
  });

  it("takes nothing away for a wrong drag", () => {
    // Dragging across the grid is how the question is read, not only how it
    // is answered.
    const tried = drawn([4, 0, 4, 4], [3, 0, 3, 4], [0, 0, 0, 2]);

    expect(scoreOf(data(), tried).earned).toBe(1);
  });

  it("scores nothing for no answer at all", () => {
    expect(scoreOf(data(), undefined)).toEqual({ earned: 0, possible: 2 });
  });
});

describe("outcomes", () => {
  it("says which words are still out there", () => {
    expect(outcomes(data(), drawn([0, 0, 0, 2]))).toEqual([
      { wordId: "cat", found: true },
      { wordId: "code", found: false },
    ]);
  });
});

describe("evaluate", () => {
  it("is correct only when every word has been found", () => {
    const all = drawn([0, 0, 0, 2], [0, 0, 3, 0]);

    expect(evaluate({ data: data(), answer: all })).toMatchObject({
      state: "correct",
      score: { earned: 2, possible: 2 },
    });
  });

  it("is wrong while a word is still hidden", () => {
    expect(evaluate({ data: data(), answer: drawn([0, 0, 0, 2]) })).toMatchObject({
      state: "wrong",
      score: { earned: 1, possible: 2 },
    });
  });

  it("does not judge a task that is not being marked", () => {
    const result = evaluate({
      data: data({
        evaluation: { mode: "skip", enableRetry: false, showFeedback: false, weight: 1 },
      }),
      answer: drawn([0, 0, 0, 2]),
    });

    expect(result.state).toBe("unknown");
  });
});
