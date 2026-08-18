import { describe, expect, it } from "vitest";
import { evaluate, outcomes, scoreOf, summary } from "./evaluate";
import { DataSchema, indexOfDifficulty, type Answer, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    aspectRatio: 1,
    targets: [
      { id: "a", x: 0.2, y: 0.5, radius: 0.05 },
      { id: "b", x: 0.8, y: 0.5, radius: 0.05 },
    ],
    allowanceMs: 1000,
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const clicked = (
  ...rounds: [string, boolean, number][]
): Answer => ({
  optedOut: false,
  rounds: rounds.map(([targetId, hit, ms]) => ({ targetId, x: 0.5, y: 0.5, hit, ms })),
});

describe("outcomes", () => {
  it("measures each move from where the pointer already was", () => {
    const marks = outcomes(data(), clicked(["a", true, 300], ["b", true, 400]));

    // The first move starts from the middle of the area, the second from the
    // target just clicked — which is where the hand actually is.
    expect(marks[0].distance).toBeCloseTo(0.3, 5);
    expect(marks[1].distance).toBeCloseTo(0.6, 5);
  });

  it("reports the width a hit was measured against", () => {
    expect(outcomes(data(), clicked(["a", true, 300]))[0].width).toBeCloseTo(0.1, 5);
  });

  it("gives Fitts's index of difficulty for the move", () => {
    const marks = outcomes(data(), clicked(["a", true, 300]));

    expect(marks[0].difficulty).toBeCloseTo(indexOfDifficulty(0.3, 0.1), 5);
  });

  it("counts a hit inside the allowance as in time", () => {
    const marks = outcomes(data(), clicked(["a", true, 900], ["b", true, 1200]));

    expect(marks.map((mark) => mark.inTime)).toEqual([true, false]);
  });

  it("never calls a miss in time, however quick it was", () => {
    expect(outcomes(data(), clicked(["a", false, 10]))[0].inTime).toBe(false);
  });
});

describe("summary", () => {
  it("averages the time over the hits only", () => {
    const marks = outcomes(data(), clicked(["a", true, 400], ["b", false, 2000]));

    // A miss says nothing about how fast someone is.
    expect(summary(marks)).toEqual({ hits: 1, misses: 1, meanMs: 400 });
  });

  it("has no average when nothing was hit", () => {
    expect(summary(outcomes(data(), clicked(["a", false, 400]))).meanMs).toBe(0);
  });
});

describe("scoreOf", () => {
  it("gives a point per target hit", () => {
    expect(scoreOf(data(), clicked(["a", true, 300], ["b", false, 300]))).toEqual({
      earned: 1,
      possible: 2,
    });
  });

  it("counts accuracy and speed apart when both are asked for", () => {
    const both = data({ scoring: "hitsAndSpeed" });

    // Hit both, but one of them slowly: the accurate half is still earned.
    expect(scoreOf(both, clicked(["a", true, 300], ["b", true, 5000]))).toEqual({
      earned: 3,
      possible: 4,
    });
  });

  it("scores nothing for a task never attempted", () => {
    expect(scoreOf(data(), undefined)).toEqual({ earned: 0, possible: 2 });
  });
});

describe("evaluate", () => {
  it("is correct only when every target was hit", () => {
    expect(
      evaluate({ data: data(), answer: clicked(["a", true, 300], ["b", true, 300]) }),
    ).toMatchObject({ state: "correct", score: { earned: 2, possible: 2 } });
  });

  it("carries the per-round detail, so a lesson can plot it", () => {
    const result = evaluate({
      data: data(),
      answer: clicked(["a", true, 300], ["b", true, 400]),
    });

    expect(result.detail?.rounds).toHaveLength(2);
    expect(result.detail?.meanMs).toBe(350);
  });

  describe("standing down", () => {
    const stoodDown: Answer = { rounds: [], optedOut: true };

    it("is not marked at all", () => {
      // Not a wrong answer, and not a zero either: "could not use a mouse" is
      // not a claim about what the learner knows.
      expect(evaluate({ data: data(), answer: stoodDown })).toMatchObject({
        state: "unknown",
        score: { earned: 0, possible: 0 },
      });
    });

    it("takes nothing off the total it is part of", () => {
      const result = evaluate({ data: data(), answer: stoodDown });

      // Nothing out of nothing, which is what keeps the rest of the
      // assessment's ratio honest.
      expect(result.score).toEqual({ earned: 0, possible: 0 });
      expect(result.detail?.optedOut).toBe(true);
    });
  });

  it("does not judge a task that is not being marked", () => {
    const result = evaluate({
      data: data({
        evaluation: { mode: "skip", enableRetry: false, showFeedback: false, weight: 1 },
      }),
      answer: clicked(["a", true, 300]),
    });

    expect(result.state).toBe("unknown");
  });
});
