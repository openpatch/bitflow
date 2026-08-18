import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";

const base = {
  instruction: "Put the steps in order.",
  items: [
    { id: "a", kind: "text", label: "Read the input" },
    { id: "b", kind: "text", label: "Sort it" },
    { id: "c", kind: "text", label: "Print the result" },
  ],
  evaluation: defaultEvaluation(),
};

const problems = (over: Record<string, unknown>): string => {
  const parsed = DataSchema.safeParse({ ...base, ...over });
  return parsed.success
    ? ""
    : parsed.error.issues.map((issue) => issue.message).join(" | ");
};

describe("DataSchema", () => {
  it("accepts a well-formed task", () => {
    expect(DataSchema.safeParse(base).success).toBe(true);
  });

  it("refuses fewer than three items", () => {
    // Two is a coin toss dressed as a task; H5P asks for three too.
    expect(problems({ items: base.items.slice(0, 2) })).toContain(
      "at least three items",
    );
  });

  it("insists every item says something", () => {
    expect(
      problems({ items: [{ ...base.items[0], label: "" }, ...base.items.slice(1)] }),
    ).toContain("Give this item some text");
  });

  it("asks a picture item to be described", () => {
    expect(
      problems({
        items: [
          { id: "a", kind: "image", label: "", image: { src: "data:x", alt: "" } },
          ...base.items.slice(1),
        ],
      }),
    ).toContain("Describe this picture");
  });

  it("asks a picture item for a picture", () => {
    expect(
      problems({
        items: [
          { id: "a", kind: "image", label: "A diagram" },
          ...base.items.slice(1),
        ],
      }),
    ).toContain("Choose a picture");
  });

  it("catches duplicate ids", () => {
    expect(
      problems({ items: [base.items[0], base.items[0], base.items[2]] }),
    ).toContain("own id");
  });

  it("leaves an ungraded task alone", () => {
    expect(
      problems({ items: [], evaluation: { ...defaultEvaluation(), mode: "skip" } }),
    ).toBe("");
  });
});
