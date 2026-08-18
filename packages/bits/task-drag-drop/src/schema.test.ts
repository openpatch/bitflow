import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";

const base = {
  instruction: "Label the diagram.",
  background: { src: "/cpu.png", alt: "A CPU diagram" },
  elements: [
    { id: "alu", label: "ALU", x: 0.05, y: 0.05, width: 0.2, height: 0.1 },
  ],
  dropZones: [
    {
      id: "left",
      label: "Left block",
      x: 0.4,
      y: 0.05,
      width: 0.25,
      height: 0.2,
      correctElementIds: ["alu"],
    },
  ],
  evaluation: defaultEvaluation(),
};

/** The messages a document is refused with, joined for easy matching. */
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

  it("insists the image is described", () => {
    expect(problems({ background: { src: "/cpu.png", alt: " " } })).toContain(
      "Describe the image",
    );
  });

  it("insists every drop zone is named", () => {
    expect(problems({ dropZones: [{ ...base.dropZones[0], label: "" }] })).toContain(
      "Name this drop zone",
    );
  });

  it("insists every element says something", () => {
    expect(problems({ elements: [{ ...base.elements[0], label: "" }] })).toContain(
      "Give this element some text",
    );
  });

  it("catches a box hanging off the edge", () => {
    expect(problems({ elements: [{ ...base.elements[0], x: 0.95 }] })).toContain(
      "runs off the edge",
    );
  });

  it("catches a zone expecting an element that does not exist", () => {
    expect(
      problems({ dropZones: [{ ...base.dropZones[0], correctElementIds: ["ghost"] }] }),
    ).toContain('expects "ghost"');
  });

  it("catches duplicate ids", () => {
    expect(
      problems({
        elements: [base.elements[0], { ...base.elements[0], label: "Also ALU" }],
      }),
    ).toContain("own id");
  });

  it("refuses a task with nothing to move or nowhere to put it", () => {
    expect(problems({ elements: [] })).toContain("at least one element");
    expect(problems({ dropZones: [] })).toContain("at least one drop zone");
  });

  it("refuses a task no answer can get right", () => {
    expect(
      problems({ dropZones: [{ ...base.dropZones[0], correctElementIds: [] }] }),
    ).toContain("no answer can be right");
  });

  it("refuses cloning with penalties off", () => {
    // Otherwise dropping everything into every zone is full marks.
    expect(
      problems({
        applyPenalties: false,
        elements: [{ ...base.elements[0], multiple: true }],
      }),
    ).toContain("Switch penalties on");
  });

  it("leaves an ungraded task alone", () => {
    expect(
      problems({
        elements: [],
        dropZones: [],
        evaluation: { ...defaultEvaluation(), mode: "skip" },
      }),
    ).toBe("");
  });

  it("fills in what an older document does not say", () => {
    const parsed = DataSchema.parse({
      background: base.background,
      elements: base.elements,
      dropZones: base.dropZones,
    });

    // H5P's defaults, so a converted file behaves the way it did there.
    expect(parsed.applyPenalties).toBe(true);
    expect(parsed.singlePoint).toBe(false);
    expect(parsed.size).toEqual({ width: 620, height: 310 });
    expect(parsed.elements[0].backgroundOpacity).toBe(100);
  });
});
