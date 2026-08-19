// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  acceptedFor,
  answerNamesIn,
  blankNamesIn,
  DataSchema,
  hasBlanks,
  SINGLE_BLANK,
} from "./schema";

const problems = (data: Record<string, unknown>): Record<string, string> => {
  const result = DataSchema.safeParse({
    blanks: { answer: { expected: "2x", accepted: [] } },
    ...data,
  });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
};

describe("finding the blanks", () => {
  it("reads every \\placeholder name, once each, in order", () => {
    expect(blankNamesIn("x=\\placeholder[a]{}+\\placeholder[b]{}")).toEqual(["a", "b"]);
    expect(blankNamesIn("\\placeholder[a]{}+\\placeholder[a]{}")).toEqual(["a"]);
    expect(blankNamesIn("x^2+1")).toEqual([]);
  });

  it("gives a formula with no blanks a single reserved answer instead", () => {
    // The whole reason the two shapes are one bit: everything downstream can
    // ask for the names and stop caring which shape it is looking at.
    expect(answerNamesIn("")).toEqual([SINGLE_BLANK]);
    expect(answerNamesIn("x^2+1")).toEqual([SINGLE_BLANK]);
    expect(answerNamesIn("\\placeholder[a]{}")).toEqual(["a"]);
  });

  it("knows which shape it is", () => {
    const withBlank = DataSchema.parse({
      latex: "\\placeholder[a]{}",
      blanks: { a: { expected: "2", accepted: [] } },
    });
    const without = DataSchema.parse({
      latex: "x^2",
      blanks: { answer: { expected: "2x", accepted: [] } },
    });
    expect(hasBlanks(withBlank)).toBe(true);
    expect(hasBlanks(without)).toBe(false);
  });
});

describe("DataSchema", () => {
  it("accepts an empty formula as the single-answer-box case", () => {
    // Not a mistake: "what is the derivative of x²?" wants a box and nothing
    // printed around it.
    expect(problems({ latex: "" })).toEqual({});
  });

  it("asks for an expected answer for every blank", () => {
    const found = problems({
      latex: "\\placeholder[a]{}+\\placeholder[b]{}",
      blanks: { a: { expected: "2", accepted: [] } },
    });
    expect(found["blanks.b"]).toMatch(/blank “b”/);
    expect(found["blanks.a"]).toBeUndefined();
  });

  it("catches an expected answer whose blank has gone", () => {
    // Almost always a rename, and silent without this: the old blank keeps
    // its answer and the new one has none.
    const found = problems({
      latex: "\\placeholder[b]{}",
      blanks: {
        b: { expected: "2", accepted: [] },
        a: { expected: "9", accepted: [] },
      },
    });
    expect(found["blanks.a"]).toMatch(/no such blank/);
  });

  it("catches feedback aimed at a blank that is not there", () => {
    const found = problems({
      latex: "\\placeholder[a]{}",
      blanks: { a: { expected: "2", accepted: [] } },
      blankFeedback: [
        { blank: "typo", latex: "3", feedback: { message: "x", severity: "info" } },
      ],
    });
    expect(found["blankFeedback.0.blank"]).toMatch(/no blank called/);
  });

  it("will not let a tolerance sit where nothing reads it", () => {
    expect(problems({ compare: "symbolic", tolerance: 0.5 }).tolerance).toMatch(
      /compared by value/,
    );
    expect(problems({ compare: "equivalent", tolerance: 0.5 }).tolerance).toMatch(
      /compared by value/,
    );
    expect(problems({ compare: "value", tolerance: 0.5 }).tolerance).toBeUndefined();
  });

  it("says nothing about grading when grading is switched off", () => {
    expect(
      problems({
        blanks: {},
        evaluation: { mode: "skip", enableRetry: false, showFeedback: true, weight: 1 },
      }),
    ).toEqual({});
  });
});

describe("acceptedFor", () => {
  it("is the expected answer and its alternatives, without the blanks", () => {
    const data = DataSchema.parse({
      latex: "",
      blanks: { answer: { expected: "\\frac{1}{2}", accepted: ["0.5", "  ", "50\\%"] } },
    });
    expect(acceptedFor(data, SINGLE_BLANK)).toEqual(["\\frac{1}{2}", "0.5", "50\\%"]);
    expect(acceptedFor(data, "nope")).toEqual([]);
  });
});
