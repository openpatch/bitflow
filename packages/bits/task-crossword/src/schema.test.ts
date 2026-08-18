import { describe, expect, it } from "vitest";
import { DataSchema, cellsOf, lettersOf, normalise, type Word } from "./schema";

/** Two words sharing the R of WORD, which is where ROW begins. */
const crossing = (): Word[] => [
  { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
  { id: "b", clue: "A line of seats", answer: "ROW", row: 0, column: 2, orientation: "down" },
];

const parse = (words: Word[], over = {}) =>
  DataSchema.safeParse({ words, ...over });

const messages = (words: Word[], over = {}) =>
  (parse(words, over).error?.issues ?? []).map((issue) => issue.message);

describe("DataSchema", () => {
  it("accepts two words that cross", () => {
    expect(messages(crossing())).toEqual([]);
  });

  it("refuses a single word", () => {
    expect(messages([crossing()[0]]).join(" ")).toMatch(/at least two words/i);
  });

  it("refuses an answer of one letter", () => {
    const words = crossing();
    words[1].answer = "R";
    expect(messages(words).join(" ")).toMatch(/at least two letters/i);
  });

  it("asks for a clue", () => {
    const words = crossing();
    words[0].clue = "  ";
    expect(messages(words).join(" ")).toMatch(/give this word a clue/i);
  });

  it("refuses two words that want different letters where they cross", () => {
    const words = crossing();
    // Still starting on WORD's R, but now wanting an S there.
    words[1].answer = "SEW";
    expect(messages(words).join(" ")).toMatch(/but one wants/i);
  });

  it("refuses two words laid on top of each other", () => {
    const words = crossing();
    words[1] = { ...words[1], answer: "WORD", orientation: "across", row: 0, column: 0 };
    expect(messages(words).join(" ")).toMatch(/lies on top of/i);
  });

  it("refuses a word nothing crosses", () => {
    const words: Word[] = [
      ...crossing(),
      { id: "c", clue: "Far away", answer: "ISLAND", row: 8, column: 8, orientation: "across" },
    ];
    expect(messages(words).join(" ")).toMatch(/cannot be reached/i);
  });

  it("refuses two crosswords printed on one sheet", () => {
    // Each pair crosses, but the pairs never meet.
    const words: Word[] = [
      ...crossing(),
      { id: "c", clue: "A tree", answer: "OAK", row: 9, column: 9, orientation: "across" },
      { id: "d", clue: "Not shut", answer: "OPEN", row: 9, column: 9, orientation: "down" },
    ];
    expect(messages(words).join(" ")).toMatch(/cannot be reached/i);
  });

  it("says nothing about the grid when nothing is being marked", () => {
    // An author part-way through, or a task the teacher marks by hand.
    const words = [crossing()[0]];
    expect(messages(words, { evaluation: { mode: "skip" } })).toEqual([]);
  });
});

describe("lettersOf", () => {
  it("ignores case and spaces, since neither should decide a mark", () => {
    expect(lettersOf(" ice cream ")).toEqual([..."ICECREAM"]);
  });
});

describe("normalise", () => {
  it("keeps one uppercase letter", () => {
    expect(normalise("q")).toBe("Q");
    expect(normalise("")).toBe("");
  });
});

describe("cellsOf", () => {
  it("walks right for an across word and down for a down one", () => {
    const [across, down] = crossing();
    expect(cellsOf(across)).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 0, column: 2 },
      { row: 0, column: 3 },
    ]);
    expect(cellsOf(down)).toEqual([
      { row: 0, column: 2 },
      { row: 1, column: 2 },
      { row: 2, column: 2 },
    ]);
  });
});
