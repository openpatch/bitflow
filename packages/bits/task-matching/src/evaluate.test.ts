import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, isRight } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Match each term to its meaning.",
    pairs: [
      {
        id: "cpu",
        left: { kind: "text", label: "CPU" },
        right: { kind: "text", label: "Carries out instructions" },
      },
      {
        id: "ram",
        left: { kind: "text", label: "RAM" },
        right: { kind: "text", label: "Holds what is being worked on" },
      },
      {
        id: "disk",
        left: { kind: "text", label: "Disk" },
        right: { kind: "text", label: "Keeps things when the power is off" },
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const score = (pairs: Array<[string, string]>, over: Partial<Data> = {}) =>
  evaluate({
    data: data(over),
    answer: { matches: pairs.map(([leftId, rightId]) => ({ leftId, rightId })) },
  });

describe("isRight", () => {
  it("is right when both cards came from the same pair", () => {
    expect(isRight({ leftId: "cpu", rightId: "cpu" })).toBe(true);
    expect(isRight({ leftId: "cpu", rightId: "ram" })).toBe(false);
  });
});

describe("evaluate", () => {
  it("is correct when every pair is back together", () => {
    const result = score([
      ["cpu", "cpu"],
      ["ram", "ram"],
      ["disk", "disk"],
    ]);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 3, possible: 3 });
  });

  it("gives a point for each pair that holds", () => {
    const result = score([
      ["cpu", "cpu"],
      ["ram", "disk"],
    ]);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 3 });
  });

  it("does not punish a card left unmatched", () => {
    // Leaving one alone is not a claim about it, so it simply earns nothing.
    expect(score([["cpu", "cpu"]]).score).toEqual({ earned: 1, possible: 3 });
  });

  it("marks each pairing, so the learner sees which held", () => {
    const detail = score([
      ["cpu", "cpu"],
      ["ram", "disk"],
    ]).detail?.matches as Array<{ correct: boolean }>;

    expect(detail.map((m) => m.correct)).toEqual([true, false]);
  });

  it("survives no answer at all", () => {
    const result = evaluate({ data: data() });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 3 });
  });

  it("does not grade at all when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { ...defaultEvaluation(), mode: "skip" } }),
      answer: { matches: [] },
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

  it("refuses a single pair", () => {
    // With one there is nothing to choose between.
    expect(problems({ pairs: data().pairs.slice(0, 1) })).toContain(
      "at least two pairs",
    );
  });

  it("insists both cards say something", () => {
    expect(
      problems({
        pairs: [
          { ...data().pairs[0], right: { kind: "text", label: "" } },
          ...data().pairs.slice(1),
        ],
      }),
    ).toContain("Give this card some text");
  });

  it("asks a picture card to be described and to have a picture", () => {
    expect(
      problems({
        pairs: [
          { ...data().pairs[0], left: { kind: "image", label: "" } },
          ...data().pairs.slice(1),
        ],
      }),
    ).toContain("Describe this picture");
    expect(
      problems({
        pairs: [
          { ...data().pairs[0], left: { kind: "image", label: "A chip" } },
          ...data().pairs.slice(1),
        ],
      }),
    ).toContain("Choose a picture");
  });

  it("catches duplicate ids", () => {
    expect(
      problems({ pairs: [data().pairs[0], data().pairs[0], data().pairs[2]] }),
    ).toContain("own id");
  });

  it("leaves an ungraded task alone", () => {
    expect(
      problems({ pairs: [], evaluation: { ...defaultEvaluation(), mode: "skip" } }),
    ).toBe("");
  });
});
