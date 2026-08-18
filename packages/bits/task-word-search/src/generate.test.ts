import { describe, expect, it } from "vitest";
import { generate, seededRandom } from "./generate";
import { DataSchema, cellsOf, lettersOf, type Direction, type Word } from "./schema";

const words = (...texts: string[]): Word[] =>
  texts.map((text, index) => ({
    id: `w${index}`,
    text,
    row: 0,
    column: 0,
    direction: "east" as const,
  }));

const every: Direction[] = [
  "east",
  "west",
  "south",
  "north",
  "southEast",
  "southWest",
  "northEast",
  "northWest",
];

const build = (texts: string[], over: Partial<Parameters<typeof generate>[1]> = {}) =>
  generate(words(...texts), { rows: 10, columns: 10, directions: every, ...over });

/** What the grid says at a position. */
const at = (grid: { letters: string; columns: number }, row: number, column: number) =>
  grid.letters[row * grid.columns + column];

describe("generate", () => {
  it("puts every word somewhere in the grid", () => {
    const result = build(["ARRAY", "LOOP", "STACK", "QUEUE", "TREE"]);

    expect(result.unplaced).toEqual([]);
    for (const word of result.words) {
      const spelled = cellsOf(word)
        .map((cell) => at(result, cell.row, cell.column))
        .join("");
      expect(spelled).toBe(lettersOf(word.text).join(""));
    }
  });

  it("fills the whole grid", () => {
    const result = build(["ARRAY", "LOOP"]);

    expect(result.letters).toHaveLength(100);
    expect(result.letters).toMatch(/^[A-Z]+$/);
  });

  it("passes its own validation", () => {
    const result = build(["ARRAY", "LOOP", "STACK"]);
    const parsed = DataSchema.safeParse({
      rows: result.rows,
      columns: result.columns,
      letters: result.letters,
      words: result.words,
    });

    expect(parsed.error?.issues ?? []).toEqual([]);
  });

  it("builds the same grid from the same words every time", () => {
    const once = build(["ARRAY", "LOOP", "STACK"]);
    const again = build(["ARRAY", "LOOP", "STACK"]);

    // A puzzle that changed each time it was saved could not be reviewed.
    expect(again.letters).toBe(once.letters);
    expect(again.words).toEqual(once.words);
  });

  it("does not depend on the order the author typed them", () => {
    const first = build(["ARRAY", "LOOP", "STACK"]);
    const shuffled = build(["STACK", "ARRAY", "LOOP"]);

    const places = (result: { words: Word[] }) =>
      Object.fromEntries(
        result.words.map((word) => [
          word.text,
          `${word.row},${word.column},${word.direction}`,
        ]),
      );
    expect(places(shuffled)).toEqual(places(first));
  });

  it("uses only the runs the author allowed", () => {
    const result = build(["ARRAY", "LOOP", "STACK"], {
      directions: ["east", "south"],
    });

    expect(new Set(result.words.map((word) => word.direction))).toEqual(
      new Set(["east", "south"]),
    );
  });

  it("never spells a hidden word anywhere it was not put", () => {
    const texts = ["ARRAY", "LOOP", "STACK", "QUEUE", "TREE", "NODE"];
    const result = build(texts);

    // A filler letter completing a word elsewhere makes a correct-looking
    // find that would be marked wrong.
    const placed = new Set(
      result.words.flatMap((word) =>
        cellsOf(word).map((cell) => `${word.id}:${cell.row},${cell.column}`),
      ),
    );
    for (const word of result.words) {
      const wanted = lettersOf(word.text).join("");
      const own = cellsOf(word)
        .map((cell) => `${cell.row},${cell.column}`)
        .join(">");
      let seen = 0;
      for (const run of allRuns(result, wanted.length)) {
        if (run.text === wanted || run.text === [...wanted].reverse().join("")) {
          if (run.path !== own && run.path !== own.split(">").reverse().join(">")) {
            seen++;
          }
        }
      }
      expect({ word: word.text, extra: seen, placed: placed.size > 0 }).toEqual({
        word: word.text,
        extra: 0,
        placed: true,
      });
    }
  });

  it("hands back a word there was no room for", () => {
    const result = build(["ABCDEFGHIJKLMNOP"], { rows: 4, columns: 4 });

    expect(result.unplaced.map((word) => word.text)).toEqual(["ABCDEFGHIJKLMNOP"]);
  });
});

/** Every straight run of a given length in the grid, with its path. */
function* allRuns(
  grid: { letters: string; rows: number; columns: number },
  length: number,
): Generator<{ text: string; path: string }> {
  const steps = [
    { row: 0, column: 1 },
    { row: 1, column: 0 },
    { row: 1, column: 1 },
    { row: 1, column: -1 },
  ];
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      for (const step of steps) {
        const cells: string[] = [];
        let text = "";
        for (let index = 0; index < length; index++) {
          const r = row + step.row * index;
          const c = column + step.column * index;
          if (r < 0 || c < 0 || r >= grid.rows || c >= grid.columns) break;
          text += grid.letters[r * grid.columns + c];
          cells.push(`${r},${c}`);
        }
        if (text.length === length) yield { text, path: cells.join(">") };
      }
    }
  }
}

describe("seededRandom", () => {
  it("gives the same sequence for the same seed", () => {
    const a = seededRandom("words");
    const b = seededRandom("words");

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("gives a different one for a different seed", () => {
    expect(seededRandom("a")()).not.toBe(seededRandom("b")());
  });
});
