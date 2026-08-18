import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";

const base = {
  instruction: "Label the diagram.",
  background: { src: "/cpu.png", alt: "A CPU diagram" },
  items: [
    { id: "alu", kind: "text", label: "ALU" },
    { id: "reg", kind: "text", label: "Registers" },
  ],
  zones: [
    {
      id: "alu-zone",
      label: "Arithmetic logic unit",
      rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      acceptedItemIds: ["alu"],
      score: 1,
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
    // The picture is the task, so this is not a nicety.
    expect(problems({ background: { src: "/cpu.png", alt: "  " } })).toContain(
      "Describe the image",
    );
  });

  it("does not ask for a description when there is no image", () => {
    expect(problems({ background: { src: "", alt: "" } })).not.toContain(
      "Describe the image",
    );
  });

  it("insists every region is named", () => {
    expect(
      problems({ zones: [{ ...base.zones[0], label: "" }] }),
    ).toContain("Name this region");
  });

  it("catches a region hanging off the edge of the image", () => {
    expect(
      problems({
        zones: [
          { ...base.zones[0], rect: { x: 0.9, y: 0.1, width: 0.2, height: 0.2 } },
        ],
      }),
    ).toContain("runs off the edge");
  });

  it("catches a region accepting a label that does not exist", () => {
    expect(
      problems({ zones: [{ ...base.zones[0], acceptedItemIds: ["ghost"] }] }),
    ).toContain('accepts "ghost"');
  });

  it("catches duplicate ids", () => {
    expect(
      problems({
        items: [
          { id: "alu", kind: "text", label: "ALU" },
          { id: "alu", kind: "text", label: "Also ALU" },
        ],
      }),
    ).toContain("own id");
  });

  it("refuses a task with nothing to place", () => {
    expect(problems({ items: [] })).toContain("at least one label");
  });

  it("refuses a task with nowhere to place it", () => {
    expect(problems({ zones: [] })).toContain("at least one region");
  });

  it("refuses a task no answer can get right", () => {
    expect(
      problems({ zones: [{ ...base.zones[0], acceptedItemIds: [] }] }),
    ).toContain("no answer can be right");
  });

  it("catches one label being wanted by two regions when reuse is off", () => {
    // Only one of them could ever be satisfied, and the author would find out
    // by taking their own task.
    expect(
      problems({
        zones: [
          base.zones[0],
          {
            id: "second",
            label: "Somewhere else",
            rect: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
            acceptedItemIds: ["alu"],
            score: 1,
          },
        ],
      }),
    ).toContain("can only be placed once");
  });

  it("allows that once reuse is switched on", () => {
    expect(
      problems({
        allowMultiplePlacements: true,
        zones: [
          base.zones[0],
          {
            id: "second",
            label: "Somewhere else",
            rect: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
            acceptedItemIds: ["alu"],
            score: 1,
          },
        ],
      }),
    ).toBe("");
  });

  it("leaves an ungraded task alone", () => {
    // With grading off, a half-built task is a work in progress, not an error.
    expect(
      problems({
        items: [],
        zones: [],
        evaluation: { ...defaultEvaluation(), mode: "skip" },
      }),
    ).toBe("");
  });

  it("fills in what an older document does not say", () => {
    const parsed = DataSchema.parse({
      items: base.items,
      zones: base.zones,
      background: base.background,
    });

    expect(parsed.partialCredit).toBe(true);
    expect(parsed.allowMultiplePlacements).toBe(false);
    expect(parsed.evaluation.weight).toBe(1);
  });
});
