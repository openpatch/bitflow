import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, outcomes, solutionOf } from "./evaluate";
import { DataSchema, type Data } from "./schema";

/** Three lines that belong, one that does not, with real nesting. */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Arrange the lines to add up a list.",
    language: "python",
    lines: [
      { id: "total", text: "total = 0", indent: 0 },
      { id: "loop", text: "for value in values:", indent: 0 },
      { id: "add", text: "total += value", indent: 1 },
      { id: "stray", text: "print(values)", distractor: true },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const answer = (lines: Array<[string, number]>) => ({
  lines: lines.map(([lineId, indent]) => ({ lineId, indent })),
});

const score = (lines: Array<[string, number]>, over: Partial<Data> = {}) =>
  evaluate({ data: data(over), answer: answer(lines) });

describe("solutionOf", () => {
  it("leaves the distractors out of the answer", () => {
    expect(solutionOf(data()).map((line) => line.id)).toEqual([
      "total",
      "loop",
      "add",
    ]);
  });
});

describe("outcomes", () => {
  it("judges order and indentation apart", () => {
    const marks = outcomes(data({ indentationMatters: true }), [
      { lineId: "total", indent: 0 },
      { lineId: "loop", indent: 0 },
      { lineId: "add", indent: 0 },
    ]);

    // The third line is in the right place and not nested — the commonest
    // Parsons mistake, and worth telling apart from a wrong order.
    expect(marks.map((m) => m.placed)).toEqual([true, true, true]);
    expect(marks.map((m) => m.indented)).toEqual([true, true, false]);
  });

  it("says nothing about indentation when it is not asked for", () => {
    const marks = outcomes(data(), [{ lineId: "total", indent: 3 }]);
    expect(marks[0].indented).toBeUndefined();
  });

  it("knows a line that belongs nowhere", () => {
    const marks = outcomes(data(), [{ lineId: "stray", indent: 0 }]);
    expect(marks[0].distractor).toBe(true);
  });
});

describe("evaluate", () => {
  it("is correct for the right lines in the right order", () => {
    const result = score([
      ["total", 0],
      ["loop", 0],
      ["add", 0],
    ]);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 3, possible: 3 });
  });

  it("wants the nesting too when indentation is part of the answer", () => {
    const over = { indentationMatters: true };

    // Right order, flat: every line placed, only two of three indented right.
    expect(
      score([
        ["total", 0],
        ["loop", 0],
        ["add", 0],
      ], over).score,
    ).toEqual({ earned: 5, possible: 6 });

    expect(
      score([
        ["total", 0],
        ["loop", 0],
        ["add", 1],
      ], over).score,
    ).toEqual({ earned: 6, possible: 6 });
  });

  it("gives a point for each line in its place", () => {
    expect(
      score([
        ["total", 0],
        ["add", 0],
        ["loop", 0],
      ]).score,
    ).toEqual({ earned: 1, possible: 3 });
  });

  it("does not charge for a line that does not belong, by default", () => {
    // Leaving one out is already rewarded by the lines that then land right.
    const result = score([
      ["stray", 0],
      ["total", 0],
      ["loop", 0],
    ]);

    expect(result.score).toEqual({ earned: 0, possible: 3 });
    expect(result.detail?.usedDistractors).toBe(1);
  });

  it("charges for one when the author asks it to", () => {
    const result = score(
      [
        ["total", 0],
        ["loop", 0],
        ["add", 0],
        ["stray", 0],
      ],
      { penaliseDistractors: true },
    );

    expect(result.score).toEqual({ earned: 2, possible: 3 });
  });

  it("never scores below zero", () => {
    const result = score([["stray", 0]], { penaliseDistractors: true });
    expect(result.score).toEqual({ earned: 0, possible: 3 });
  });

  it("survives no answer at all", () => {
    const result = evaluate({ data: data() });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 3 });
  });

  it("does not grade at all when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { ...defaultEvaluation(), mode: "skip" } }),
      answer: answer([["total", 0]]),
    });

    expect(result.state).toBe("unknown");
  });
});

describe("DataSchema", () => {
  const problems = (over: Record<string, unknown>): string => {
    const parsed = DataSchema.safeParse({ ...data(), ...over });
    return parsed.success
      ? ""
      : parsed.error.issues.map((issue) => issue.message).join(" | ");
  };

  it("accepts a well-formed puzzle", () => {
    expect(DataSchema.safeParse(data()).success).toBe(true);
  });

  it("refuses a puzzle with one line to place", () => {
    expect(
      problems({ lines: [{ id: "a", text: "x = 1", indent: 0 }] }),
    ).toContain("at least two lines");
  });

  it("insists every line has code on it", () => {
    expect(
      problems({ lines: [...data().lines.slice(1), { id: "blank", text: "  " }] }),
    ).toContain("Give this line some code");
  });

  it("refuses to ask for indentation that never varies", () => {
    // A column of zeros to confirm is busywork that costs half the marks.
    expect(
      problems({
        indentationMatters: true,
        lines: data().lines.map((line) => ({ ...line, indent: 0 })),
      }),
    ).toContain("adds nothing");
  });

  it("catches duplicate ids", () => {
    expect(
      problems({ lines: [data().lines[0], data().lines[0], data().lines[1]] }),
    ).toContain("own id");
  });

  it("leaves an ungraded task alone", () => {
    expect(
      problems({ lines: [], evaluation: { ...defaultEvaluation(), mode: "skip" } }),
    ).toBe("");
  });
});
