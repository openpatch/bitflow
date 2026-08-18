import { describe, expect, it } from "vitest";
import { evaluate, outcomes, scoreOf } from "./evaluate";
import { gridOf } from "./grid";
import { cellKey, DataSchema, type Answer, type Data } from "./schema";

/**
 *   W O R D
 *       O
 *       W
 */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    words: [
      { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
      { id: "b", clue: "A line of seats", answer: "ROW", row: 0, column: 2, orientation: "down" },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

/** Letters typed in, by grid position. */
const typed = (letters: Record<string, string>): Answer => ({ letters });

const solved = typed({
  [cellKey(0, 0)]: "W",
  [cellKey(0, 1)]: "O",
  [cellKey(0, 2)]: "R",
  [cellKey(0, 3)]: "D",
  [cellKey(1, 2)]: "O",
  [cellKey(2, 2)]: "W",
});

describe("outcomes", () => {
  it("marks a word right only when every letter is", () => {
    const marks = outcomes(data(), solved);

    expect(marks.map((mark) => mark.correct)).toEqual([true, true]);
  });

  it("does not call a half-typed word wrong", () => {
    const marks = outcomes(data(), typed({ [cellKey(0, 0)]: "W" }));

    // Nothing about "W???" says the learner has the wrong answer yet.
    const across = marks.find((mark) => mark.wordId === "a");
    expect(across).toMatchObject({ correct: false, complete: false, wrong: 0 });
  });

  it("counts the letters in the wrong place", () => {
    const marks = outcomes(
      data(),
      typed({ ...solved.letters, [cellKey(0, 1)]: "A", [cellKey(0, 3)]: "S" }),
    );

    expect(marks.find((mark) => mark.wordId === "a")).toMatchObject({
      correct: false,
      complete: true,
      wrong: 2,
    });
  });

  it("ignores the case the learner typed in", () => {
    const marks = outcomes(
      data(),
      typed(Object.fromEntries(
        Object.entries(solved.letters).map(([key, letter]) => [key, letter.toLowerCase()]),
      )),
    );

    expect(marks.every((mark) => mark.correct)).toBe(true);
  });
});

describe("scoreOf", () => {
  it("gives a point per word", () => {
    expect(scoreOf(data(), solved)).toEqual({ earned: 2, possible: 2 });
  });

  it("gives a point per letter when asked to", () => {
    // Six squares, since the two words share one.
    expect(scoreOf(data({ scoring: "letters" }), solved)).toEqual({
      earned: 6,
      possible: 6,
    });
  });

  it("gives partial credit by letter that it withholds by word", () => {
    const nearly = typed({ ...solved.letters, [cellKey(0, 3)]: "S" });

    expect(scoreOf(data(), nearly).earned).toBe(1);
    expect(scoreOf(data({ scoring: "letters" }), nearly).earned).toBe(5);
  });

  it("takes a point off a wrong word only when penalties are on", () => {
    const wrong = typed({ ...solved.letters, [cellKey(0, 3)]: "S" });

    expect(scoreOf(data(), wrong).earned).toBe(1);
    expect(scoreOf(data({ penaliseWrong: true }), wrong).earned).toBe(0);
  });

  it("never charges for a square left empty", () => {
    const half = typed({ [cellKey(0, 2)]: "R", [cellKey(1, 2)]: "O", [cellKey(2, 2)]: "W" });

    // The down word is right and the across word untouched: one point, not
    // one point less one. Leaving a clue must never beat trying it.
    expect(scoreOf(data({ penaliseWrong: true }), half).earned).toBe(1);
  });

  it("never goes below nothing", () => {
    const allWrong = typed(
      Object.fromEntries(Object.keys(solved.letters).map((key) => [key, "Z"])),
    );

    expect(scoreOf(data({ penaliseWrong: true }), allWrong).earned).toBe(0);
  });
});

describe("evaluate", () => {
  it("is correct only when the whole grid is", () => {
    expect(evaluate({ data: data(), answer: solved })).toMatchObject({
      state: "correct",
      score: { earned: 2, possible: 2 },
    });
  });

  it("is wrong when a word is missing", () => {
    expect(evaluate({ data: data(), answer: typed({}) })).toMatchObject({
      state: "wrong",
      score: { earned: 0, possible: 2 },
    });
  });

  it("carries the per-word marks, so each clue can be marked", () => {
    const result = evaluate({ data: data(), answer: solved });

    expect(result.detail?.words).toHaveLength(2);
  });

  it("does not judge a task that is not being marked", () => {
    const result = evaluate({
      data: data({ evaluation: { mode: "skip", enableRetry: false, showFeedback: false, weight: 1 } }),
      answer: solved,
    });

    expect(result.state).toBe("unknown");
  });

  it("counts the shared square once", () => {
    // Six letters over two words of four and three: the crossing is one
    // square, not two, and marking it twice would inflate every crossword.
    expect(gridOf(data()).cells.size).toBe(6);
  });
});
