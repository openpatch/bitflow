import { describe, expect, it } from "vitest";
import { acceptedUnits, DataSchema } from "./schema";

/** The messages an author would see, by the field they sit under. */
const problems = (data: Record<string, unknown>): Record<string, string> => {
  const result = DataSchema.safeParse({ expected: "1", ...data });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
};

describe("DataSchema", () => {
  it("accepts a question that is ready to set", () => {
    expect(problems({ expected: "9.81", unitMode: "shown", unit: "m/s^2" })).toEqual(
      {},
    );
  });

  it("asks for an expected answer it can work out", () => {
    expect(problems({ expected: "" }).expected).toMatch(/Enter the answer/);
    expect(problems({ expected: "roughly ten" }).expected).toMatch(/not a number/);
  });

  it("sends the unit to the unit field rather than marking everyone wrong", () => {
    // `9.81 m/s^2` in the expected box would otherwise compare the learner's
    // number against a value that has a unit stuck to it.
    expect(problems({ expected: "9.81 m/s^2" }).expected).toMatch(/Leave the unit out/);
  });

  it("will not leave a mark nobody can earn", () => {
    expect(
      problems({ scoring: "valueAndUnit", unitMode: "shown", unit: "kg" }).scoring,
    ).toMatch(/has to type it/);
    expect(
      problems({ scoring: "valueAndUnit", unitMode: "required", unit: "kg" }).scoring,
    ).toBeUndefined();
  });

  it("will not accept a unit mode with no unit behind it", () => {
    expect(problems({ unitMode: "required", unit: "  " }).unit).toMatch(/Enter the unit/);
  });

  it("catches a tolerance that is not one", () => {
    expect(problems({ tolerance: "absolute", toleranceValue: 0 }).toleranceValue).toMatch(
      /same as asking for an exact answer/,
    );
    expect(problems({ tolerance: "significant", digits: 0 }).digits).toMatch(
      /at least one significant figure/,
    );
  });

  it("checks the feedback values too, since they are compared like answers", () => {
    const found = problems({
      valueFeedback: [{ value: "not a number", feedback: { message: "x", severity: "info" } }],
    });
    expect(found["valueFeedback.0.value"]).toMatch(/not a number/);
  });

  it("says nothing about grading when grading is switched off", () => {
    expect(
      problems({
        expected: "",
        evaluation: { mode: "skip", enableRetry: false, showFeedback: true, weight: 1 },
      }),
    ).toEqual({});
  });

  it("lets the author write an expression rather than a rounded decimal", () => {
    expect(problems({ expected: "2*pi*0.35" })).toEqual({});
    // …even where the learner is held to a plain number.
    expect(problems({ expected: "2*pi*0.35", allowExpression: false })).toEqual({});
  });
});

describe("acceptedUnits", () => {
  it("is the unit and its alternatives, without the blanks", () => {
    const data = DataSchema.parse({
      expected: "1",
      unitMode: "required",
      unit: "m/s^2",
      unitAlternatives: ["m/s²", "  ", "N/kg"],
    });
    expect(acceptedUnits(data)).toEqual(["m/s^2", "m/s²", "N/kg"]);
  });
});
