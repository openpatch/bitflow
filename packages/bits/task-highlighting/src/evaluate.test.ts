import { describe, expect, it } from "vitest";
import { agreementPerColor, evaluate, kappa } from "./evaluate";
import { DataSchema, type Color, type Data, type Highlights } from "./schema";

/** `"..yyy.."` → highlights, where a dot is unmarked. */
const marks = (pattern: string, color: Color = "yellow"): Highlights =>
  [...pattern].map((c) => (c === "." ? null : color));

const text = "the cat sat on the mat";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({
    text,
    colors: { yellow: { enabled: true, label: "animal" } },
    // "cat", characters 4-6.
    reference: marks("....yyy...............".slice(0, text.length)),
    cutoffs: { yellow: 0.6 },
    ...overrides,
  });

describe("kappa", () => {
  it("is 1 for perfect agreement", () => {
    expect(
      kappa({ bothHighlighted: 5, bothPlain: 5, onlyLearner: 0, onlyReference: 0 }),
    ).toBe(1);
  });

  it("is 0 when agreement is no better than chance", () => {
    // Marking nothing on a mostly-unmarked text agrees on almost every
    // character, which is exactly the false positive raw overlap would give.
    expect(
      kappa({ bothHighlighted: 0, bothPlain: 95, onlyLearner: 0, onlyReference: 5 }),
    ).toBeLessThan(0.01);
  });

  it("is negative when agreement is worse than chance", () => {
    expect(
      kappa({ bothHighlighted: 0, bothPlain: 0, onlyLearner: 5, onlyReference: 5 }),
    ).toBeLessThan(0);
  });

  it("is 0 rather than NaN when there is nothing to compare", () => {
    expect(
      kappa({ bothHighlighted: 0, bothPlain: 0, onlyLearner: 0, onlyReference: 0 }),
    ).toBe(0);
  });
});

describe("agreementPerColor", () => {
  it("scores an identical highlighting as full agreement", () => {
    const d = data();
    expect(agreementPerColor(d, d.reference).yellow).toBe(1);
  });

  it("scores an empty highlighting at or below zero", () => {
    const d = data();
    expect(agreementPerColor(d, []).yellow).toBeLessThanOrEqual(0);
  });

  it("ignores colours the task does not use", () => {
    const d = data();
    expect(Object.keys(agreementPerColor(d, d.reference))).toEqual(["yellow"]);
  });
});

describe("evaluate", () => {
  it("is correct when agreement clears the cutoff", () => {
    const d = data();
    const result = evaluate({ data: d, answer: { highlights: d.reference } });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("is wrong when it does not", () => {
    const d = data();
    const result = evaluate({ data: d, answer: { highlights: [] } });
    expect(result.state).toBe("wrong");
  });

  it("reports the agreement it measured", () => {
    const d = data();
    const result = evaluate({ data: d, answer: { highlights: d.reference } });
    expect(result.detail?.agreement).toEqual({ yellow: 1 });
  });

  it("accepts a looser answer when the cutoff is lower", () => {
    const d = data({ cutoffs: { yellow: 0 } });
    // "the cat" instead of "cat": overlapping but not identical.
    const loose = marks("yyyyyyy...............".slice(0, text.length));
    expect(evaluate({ data: d, answer: { highlights: loose } }).state).toBe("correct");
  });

  it("requires every enabled colour to clear its cutoff", () => {
    const d = data({
      colors: {
        yellow: { enabled: true, label: "animal" },
        blue: { enabled: true, label: "place" },
      },
      cutoffs: { yellow: 0.6, blue: 0.6 },
    });
    // Only the yellow half is right.
    expect(evaluate({ data: d, answer: { highlights: d.reference } }).state).toBe("wrong");
  });

  it("respects the grading mode", () => {
    expect(
      evaluate({
        data: data({ evaluation: { mode: "skip", enableRetry: false, showFeedback: true } }),
        answer: { highlights: [] },
      }).state,
    ).toBe("unknown");
  });
});

describe("DataSchema", () => {
  it("rejects a graded task with no colour switched on", () => {
    const parsed = DataSchema.safeParse({ text, colors: {}, reference: [], cutoffs: {} });
    expect(parsed.success).toBe(false);
  });

  it("rejects a reference that no longer fits the text", () => {
    const parsed = DataSchema.safeParse({
      text,
      colors: { yellow: { enabled: true, label: "" } },
      reference: marks("...."),
      cutoffs: {},
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("does not match the text");
    }
  });
});
