import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, zoneStates } from "./evaluate";
import { DataSchema, type Data } from "./schema";

/** Two labels, two regions, one point each. */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
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
      {
        id: "reg-zone",
        label: "Register file",
        rect: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
        acceptedItemIds: ["reg"],
        score: 1,
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const check = (placements: Array<[string, string]>, over: Partial<Data> = {}) =>
  evaluate({
    data: data(over),
    answer: {
      placements: placements.map(([itemId, zoneId]) => ({ itemId, zoneId })),
    },
  });

describe("evaluate", () => {
  it("is correct when every region holds what it accepts", () => {
    const result = check([
      ["alu", "alu-zone"],
      ["reg", "reg-zone"],
    ]);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 2, possible: 2 });
  });

  it("is wrong when the labels are swapped", () => {
    const result = check([
      ["alu", "reg-zone"],
      ["reg", "alu-zone"],
    ]);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });

  it("gives credit for the region that is right", () => {
    const result = check([
      ["alu", "alu-zone"],
      ["reg", "alu-zone"],
    ]);

    // `alu-zone` now holds a label it does not accept, so it is wrong too.
    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });

  it("counts a half-finished answer as half", () => {
    const result = check([["alu", "alu-zone"]]);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("gives nothing for a half-finished answer when partial credit is off", () => {
    const result = check([["alu", "alu-zone"]], { partialCredit: false });

    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });

  it("refuses a region holding the right label and a wrong one", () => {
    // Scattering every label into one region must not score.
    const result = check([
      ["alu", "alu-zone"],
      ["reg", "alu-zone"],
      ["reg", "reg-zone"],
    ]);

    expect(result.state).toBe("wrong");
    expect((result.detail?.zones as Record<string, string>)["alu-zone"]).toBe(
      "wrong",
    );
  });

  it("weights regions against each other", () => {
    const weighted = data({
      zones: data().zones.map((zone) =>
        zone.id === "alu-zone" ? { ...zone, score: 3 } : zone,
      ),
    });

    const result = evaluate({
      data: weighted,
      answer: { placements: [{ itemId: "alu", zoneId: "alu-zone" }] },
    });

    expect(result.score).toEqual({ earned: 3, possible: 4 });
  });

  it("ignores a region that accepts nothing", () => {
    const withScenery = data({
      zones: [
        ...data().zones,
        {
          id: "scenery",
          label: "The rest of the chip",
          rect: { x: 0.8, y: 0.8, width: 0.1, height: 0.1 },
          acceptedItemIds: [],
          score: 1,
        },
      ],
    });

    const result = evaluate({
      data: withScenery,
      answer: {
        placements: [
          { itemId: "alu", zoneId: "alu-zone" },
          { itemId: "reg", zoneId: "reg-zone" },
        ],
      },
    });

    // Somewhere to park a spare label is not a question.
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 2, possible: 2 });
  });

  it("does not fail an answer for leaving a distractor unplaced", () => {
    const withDistractor = data({
      items: [...data().items, { id: "spare", kind: "text", label: "Cache" }],
    });

    const result = evaluate({
      data: withDistractor,
      answer: {
        placements: [
          { itemId: "alu", zoneId: "alu-zone" },
          { itemId: "reg", zoneId: "reg-zone" },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });

  it("awards no free mark when nothing is graded", () => {
    // The schema will not let an author save this with grading on, but a
    // document can still arrive from elsewhere, and a task nobody can get
    // right must not silently be one everybody gets right.
    const ungraded = data({
      zones: data().zones.map((zone) => ({ ...zone, acceptedItemIds: [] })),
      evaluation: { ...defaultEvaluation(), mode: "skip" },
    });

    const result = evaluate(
      { data: { ...ungraded, evaluation: defaultEvaluation() }, answer: { placements: [] } },
    );

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 0 });
  });

  it("does not grade at all when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { ...defaultEvaluation(), mode: "skip" } }),
      answer: { placements: [] },
    });

    expect(result.state).toBe("unknown");
  });

  it("survives no answer at all", () => {
    const result = evaluate({ data: data() });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });
});

describe("zoneStates", () => {
  it("tells an empty region apart from a wrong one", () => {
    const states = zoneStates(data(), [{ itemId: "reg", zoneId: "alu-zone" }]);

    // The difference matters to the learner: one is a mistake, the other is
    // unfinished, and they should not look the same.
    expect(states["alu-zone"]).toBe("wrong");
    expect(states["reg-zone"]).toBe("empty");
  });

  it("marks a region that grades nothing as neutral", () => {
    const scenery = data({
      zones: [
        {
          id: "scenery",
          label: "Background",
          rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
          acceptedItemIds: [],
          score: 1,
        },
      ],
      // Grading off, or the schema would refuse a task with nothing to grade.
      evaluation: { ...defaultEvaluation(), mode: "skip" },
    });

    expect(zoneStates(scenery, [])).toEqual({ scenery: "neutral" });
  });
});
