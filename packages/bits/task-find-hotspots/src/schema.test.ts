import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";

const base = {
  instruction: "Which is an input device?",
  background: { src: "data:image/png;base64,AAAA", alt: "A workstation" },
  hotspots: [
    {
      id: "keyboard",
      shape: "rect",
      x: 0.2,
      y: 0.6,
      width: 0.3,
      height: 0.2,
      correct: true,
      label: "The keyboard",
    },
    {
      id: "monitor",
      shape: "rect",
      x: 0.2,
      y: 0.1,
      width: 0.3,
      height: 0.3,
      correct: false,
      label: "The monitor",
    },
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

  it("insists on a picture, since there is nothing to search without one", () => {
    expect(problems({ background: { src: "", alt: "" } })).toContain(
      "Choose a picture",
    );
  });

  it("insists the picture is described", () => {
    expect(
      problems({ background: { src: "data:image/png;base64,AAAA", alt: " " } }),
    ).toContain("Describe the image");
  });

  it("insists every region is named", () => {
    // Never shown, but it is the only description for anyone who cannot see
    // the picture, and it names the region in the report.
    expect(
      problems({ hotspots: [{ ...base.hotspots[0], label: "" }, base.hotspots[1]] }),
    ).toContain("Name this region");
  });

  it("catches a region running off the picture", () => {
    expect(
      problems({ hotspots: [{ ...base.hotspots[0], x: 0.9 }, base.hotspots[1]] }),
    ).toContain("runs off the edge");
  });

  it("catches duplicate ids", () => {
    expect(
      problems({ hotspots: [base.hotspots[0], { ...base.hotspots[0] }] }),
    ).toContain("own id");
  });

  it("refuses a task with nothing to find", () => {
    expect(
      problems({
        hotspots: base.hotspots.map((hotspot) => ({ ...hotspot, correct: false })),
      }),
    ).toContain("at least one region");
  });

  it("refuses a task where every region wins", () => {
    // Then the only wrong answer is missing the regions entirely, which is
    // not the question the author meant to ask.
    expect(
      problems({
        hotspots: base.hotspots.map((hotspot) => ({ ...hotspot, correct: true })),
      }),
    ).toContain("Every region is correct");
  });

  it("allows a single region that is the answer", () => {
    // One region and nothing else is a legitimate "click the thing" task.
    expect(problems({ hotspots: [base.hotspots[0]] })).toBe("");
  });

  it("leaves an ungraded task alone", () => {
    expect(
      problems({
        background: { src: "", alt: "" },
        hotspots: [],
        evaluation: { ...defaultEvaluation(), mode: "skip" },
      }),
    ).toBe("");
  });

  it("fills in what an older document does not say", () => {
    const parsed = DataSchema.parse({
      background: base.background,
      hotspots: [{ id: "a", x: 0, y: 0, width: 0.2, height: 0.2, label: "A" }],
      // Grading off, or the guardrails would refuse a document with nothing
      // marked as the answer — which is what a bare `correct` default means.
      evaluation: { ...defaultEvaluation(), mode: "skip" },
    });

    expect(parsed.hotspots[0].shape).toBe("rect");
    expect(parsed.hotspots[0].correct).toBe(false);
    expect(parsed.size).toEqual({ width: 620, height: 310 });
  });
});
