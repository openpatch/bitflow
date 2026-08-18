import { describe, expect, it } from "vitest";
import { evaluate, measure, scoreOf } from "./evaluate";
import {
  accuracyOf,
  correctCharacters,
  DataSchema,
  wordsPerMinute,
  type Answer,
  type Data,
} from "./schema";

const TEXT = "the quick brown fox";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    text: TEXT,
    requiredAccuracy: 0.9,
    targetWpm: 20,
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const typed = (text: string, elapsedMs = 10000): Answer => ({
  typed: text,
  elapsedMs,
  optedOut: false,
});

describe("correctCharacters", () => {
  it("counts the characters in the right place", () => {
    expect(correctCharacters(TEXT, TEXT)).toBe(TEXT.length);
    // "cat" shares no letter with "fox" at any of its three places.
    expect(correctCharacters(TEXT, "the quick brown cat")).toBe(16);
  });

  it("counts nothing past the end of the shorter text", () => {
    expect(correctCharacters(TEXT, "the")).toBe(3);
  });
});

describe("accuracyOf", () => {
  it("is one for a perfect copy", () => {
    expect(accuracyOf(TEXT, TEXT)).toBe(1);
  });

  it("is measured against the longer of the two", () => {
    // Stopping half way would look perfect for as far as it went if it were
    // measured against what was typed.
    expect(accuracyOf(TEXT, "the quick")).toBeCloseTo(9 / 19, 5);
    // And typing half a page of extra has to count against it too.
    expect(accuracyOf(TEXT, TEXT + " and then some")).toBeCloseTo(19 / 33, 5);
  });

  it("is one for two empty texts", () => {
    expect(accuracyOf("", "")).toBe(1);
  });
});

describe("wordsPerMinute", () => {
  it("counts five characters to a word", () => {
    // 20 correct characters in 60 seconds is four words a minute.
    expect(wordsPerMinute("a".repeat(20), "a".repeat(20), 60000)).toBeCloseTo(4, 5);
  });

  it("is nothing when no time passed", () => {
    expect(wordsPerMinute(TEXT, TEXT, 0)).toBe(0);
  });

  it("counts only the characters that were right", () => {
    const wrongEnd = "the quick brown cat";
    expect(wordsPerMinute(TEXT, wrongEnd, 60000)).toBeCloseTo(16 / 5, 5);
  });
});

describe("measure", () => {
  it("reports nothing typed as inaccurate rather than as perfect", () => {
    // An empty answer matches an empty answer, which is not an achievement.
    expect(measure(data(), typed("")).accurateEnough).toBe(false);
  });

  it("does not time an attempt the author chose not to time", () => {
    const marks = measure(data({ timed: false }), typed(TEXT, 5000));

    expect(marks.wpm).toBe(0);
    expect(marks.elapsedMs).toBe(0);
    expect(marks.fastEnough).toBe(false);
  });
});

describe("scoreOf", () => {
  it("gives the mark for accuracy alone by default", () => {
    expect(scoreOf(data(), typed(TEXT))).toEqual({ earned: 1, possible: 1 });
  });

  it("withholds it below the accuracy the author asked for", () => {
    expect(scoreOf(data(), typed("the quick brown cat")).earned).toBe(0);
  });

  it("counts accuracy and speed apart when both are asked for", () => {
    const both = data({ scoring: "accuracyAndSpeed" });

    // 19 characters in 60 seconds is under four words a minute: accurate, and
    // nowhere near 20 words a minute.
    expect(scoreOf(both, typed(TEXT, 60000))).toEqual({ earned: 1, possible: 2 });
    // The same text in five seconds is both.
    expect(scoreOf(both, typed(TEXT, 5000))).toEqual({ earned: 2, possible: 2 });
  });

  it("never gives the speed mark for typing the wrong thing quickly", () => {
    const both = data({ scoring: "accuracyAndSpeed" });
    const fastRubbish = typed("xxxxxxxxxxxxxxxxxxx", 1000);

    // Nothing correct, so no words a minute either: speed is net of errors.
    expect(scoreOf(both, fastRubbish)).toEqual({ earned: 0, possible: 2 });
  });
});

describe("evaluate", () => {
  it("is correct when every mark was earned", () => {
    expect(evaluate({ data: data(), answer: typed(TEXT) })).toMatchObject({
      state: "correct",
      score: { earned: 1, possible: 1 },
    });
  });

  it("carries the measurements, rounded for reading", () => {
    const result = evaluate({ data: data(), answer: typed(TEXT, 60000) });

    expect(result.detail?.accuracyPercent).toBe(100);
    expect(result.detail?.wpmRounded).toBe(4);
  });

  describe("standing down", () => {
    const stoodDown: Answer = { typed: "", elapsedMs: 0, optedOut: true };

    it("is not marked at all", () => {
      // Typing speed is not a fair measure of everybody, and a task that
      // insisted would be measuring the wrong thing.
      expect(evaluate({ data: data(), answer: stoodDown })).toMatchObject({
        state: "unknown",
        score: { earned: 0, possible: 0 },
      });
    });

    it("takes nothing off the total it is part of", () => {
      expect(evaluate({ data: data(), answer: stoodDown }).score).toEqual({
        earned: 0,
        possible: 0,
      });
    });
  });

  it("does not judge a task that is not being marked", () => {
    const result = evaluate({
      data: data({
        evaluation: { mode: "skip", enableRetry: false, showFeedback: false, weight: 1 },
      }),
      answer: typed(TEXT),
    });

    expect(result.state).toBe("unknown");
  });
});

describe("DataSchema", () => {
  const messages = (over: Record<string, unknown>) =>
    (DataSchema.safeParse({ text: TEXT, ...over }).error?.issues ?? []).map(
      (issue) => issue.message,
    );

  it("asks for a passage worth measuring", () => {
    expect(messages({ text: "hi" }).join(" ")).toMatch(/at least ten characters/i);
  });

  it("refuses to score speed off the clock", () => {
    // A mark nobody can earn.
    expect(
      messages({ timed: false, scoring: "accuracyAndSpeed" }).join(" "),
    ).toMatch(/cannot be counted when the attempt is not timed/i);
  });

  it("says nothing when the task is not being marked", () => {
    expect(messages({ text: "hi", evaluation: { mode: "skip" } })).toEqual([]);
  });
});
