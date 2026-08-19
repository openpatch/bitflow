import { describe, expect, it } from "vitest";
import { DataSchema, expectedWritten } from "./schema";

const base = {
  sourceRepresentation: "decimal",
  sourceValue: "42",
  targetRepresentation: "binary",
  bitWidth: 8,
};

const messages = (over: Record<string, unknown> = {}) =>
  (DataSchema.safeParse({ ...base, ...over }).error?.issues ?? []).map(
    (issue) => issue.message,
  );

describe("DataSchema", () => {
  it("accepts a question that can be answered", () => {
    expect(messages()).toEqual([]);
  });

  it("wants a value", () => {
    expect(messages({ sourceValue: "" }).join(" ")).toMatch(/write the value/i);
  });

  it("refuses a value that is not one in its own representation", () => {
    expect(messages({ sourceValue: "12nonsense" }).join(" ")).toMatch(
      /not a value in the representation/i,
    );
  });

  it("refuses a value the width cannot hold", () => {
    expect(messages({ sourceValue: "300" }).join(" ")).toMatch(/does not fit in 8 bits/i);
  });

  it("refuses asking for the representation it was given in", () => {
    expect(messages({ targetRepresentation: "decimal" }).join(" ")).toMatch(
      /copies the question/i,
    );
  });

  it("wants separators where the answer has more than one group", () => {
    expect(
      messages({
        sourceRepresentation: "text",
        sourceValue: "HI",
        allowSeparators: false,
      }).join(" "),
    ).toMatch(/allow separators/i);
  });

  it("refuses marking digit by digit where digits do not line up", () => {
    expect(
      messages({ scoring: "digits", requireFullWidth: false }).join(" "),
    ).toMatch(/fixed width/i);
    expect(
      messages({ scoring: "digits", targetRepresentation: "text" }).join(" "),
    ).toMatch(/fixed width/i);
    expect(messages({ scoring: "digits" })).toEqual([]);
  });

  it("leaves an ungraded task alone", () => {
    expect(messages({ sourceValue: "", evaluation: { mode: "skip" } })).toEqual([]);
  });
});

describe("expectedWritten", () => {
  it("is the answer as the task will accept it", () => {
    const written = (over: Record<string, unknown>) =>
      expectedWritten(DataSchema.parse({ ...base, ...over }));

    expect(written({})).toBe("00101010");
    expect(written({ targetRepresentation: "hex" })).toBe("2a");
    expect(written({ requireFullWidth: false, bitWidth: 0 })).toBe("101010");
    expect(
      written({ sourceRepresentation: "text", sourceValue: "HI" }),
    ).toBe("01001000 01001001");
  });
});
