import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, homesOf, judge, maxScore, zoneUnder } from "./evaluate";
import { DataSchema, type Data } from "./schema";

/**
 * Two elements and two invisible regions. Positions are the answer, so every
 * fixture below is a coordinate rather than a zone id.
 */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Label the diagram.",
    background: { src: "/cpu.png", alt: "A CPU diagram" },
    elements: [
      { id: "alu", label: "ALU", x: 0.02, y: 0.05, width: 0.2, height: 0.1 },
      { id: "reg", label: "Registers", x: 0.02, y: 0.2, width: 0.2, height: 0.1 },
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
      {
        id: "right",
        label: "Right block",
        x: 0.7,
        y: 0.05,
        width: 0.25,
        height: 0.2,
        correctElementIds: ["reg"],
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

/** A position whose centre lands in the middle of the named zone. */
const on = (zoneId: string, elementId: string, document = data()) => {
  const zone = document.dropZones.find((candidate) => candidate.id === zoneId)!;
  const element = document.elements.find((candidate) => candidate.id === elementId)!;
  return {
    elementId,
    x: zone.x + zone.width / 2 - element.width / 2,
    y: zone.y + zone.height / 2 - element.height / 2,
  };
};

const check = (placements: Array<{ elementId: string; x: number; y: number }>, over: Partial<Data> = {}) =>
  evaluate({ data: data(over), answer: { placements } });

describe("zoneUnder", () => {
  it("finds the region an element's middle came to rest over", () => {
    const document = data();
    const element = document.elements[0];
    const zone = zoneUnder(document, element, on("left", "alu"));

    expect(zone?.id).toBe("left");
  });

  it("finds nothing on open ground", () => {
    const document = data();
    const element = document.elements[0];
    const zone = zoneUnder(document, element, { elementId: "alu", x: 0.02, y: 0.6 });

    expect(zone).toBeUndefined();
  });

  it("counts a region the element merely touches, by default", () => {
    // Aiming at a target is what this feels like; refusing an element that
    // overlaps the right area by nine tenths teaches the rule, not the subject.
    const document = data();
    const element = document.elements[0];
    // Spans 0.25–0.45, so it overlaps the region while its middle (0.35) is
    // outside it — the case the two rules disagree about.
    const grazing = { elementId: "alu", x: 0.25, y: 0.1 };

    expect(zoneUnder(document, element, grazing)?.id).toBe("left");
  });

  it("wants the middle inside when the region asks for that", () => {
    const strict = data({
      dropZones: data().dropZones.map((zone) =>
        zone.id === "left" ? { ...zone, tolerance: "centre" as const } : zone,
      ),
    });
    const element = strict.elements[0];

    expect(zoneUnder(strict, element, { elementId: "alu", x: 0.25, y: 0.1 })).toBeUndefined();
    expect(zoneUnder(strict, element, on("left", "alu"))?.id).toBe("left");
  });

  it("wants the whole element inside when the region asks for that", () => {
    const strict = data({
      dropZones: data().dropZones.map((zone) =>
        zone.id === "left" ? { ...zone, tolerance: "fit" as const } : zone,
      ),
    });
    const element = strict.elements[0];

    // The region is 0.25 wide and the element 0.2, so it fits only just.
    expect(zoneUnder(strict, element, { elementId: "alu", x: 0.42, y: 0.08 })?.id).toBe("left");
    expect(zoneUnder(strict, element, { elementId: "alu", x: 0.5, y: 0.08 })).toBeUndefined();
  });

  it("picks the region the element covers most when it touches two", () => {
    // `touch` makes overlapping two easy, and draw order would mark a region
    // the learner barely grazed.
    const touching = data({
      dropZones: [
        { ...data().dropZones[0], x: 0.4, width: 0.2 },
        { ...data().dropZones[1], x: 0.58, width: 0.2 },
      ],
    });
    const element = touching.elements[0];

    // Spans 0.42–0.62: 0.18 of the first region, 0.04 of the second.
    expect(zoneUnder(touching, element, { elementId: "alu", x: 0.42, y: 0.1 })?.id).toBe(
      "left",
    );
  });
});

describe("maxScore", () => {
  it("is one point per element that belongs somewhere", () => {
    expect(maxScore(data())).toBe(2);
  });

  it("ignores an element that belongs nowhere", () => {
    const withDistractor = data({
      elements: [
        ...data().elements,
        { id: "spare", kind: "text", label: "Cache", x: 0.02, y: 0.4, width: 0.2, height: 0.1, multiple: false, backgroundOpacity: 100 },
      ],
    });
    expect(maxScore(withDistractor)).toBe(2);
  });

  it("counts a reusable element once per region it belongs in", () => {
    const cloning = data({
      elements: data().elements.map((element) =>
        element.id === "alu" ? { ...element, multiple: true } : element,
      ),
      dropZones: data().dropZones.map((zone) => ({
        ...zone,
        correctElementIds: [...new Set([...zone.correctElementIds, "alu"])],
      })),
    });

    expect(maxScore(cloning)).toBe(3);
  });
});

describe("homesOf", () => {
  it("reads belonging off the region, which is the only say there is", () => {
    expect(homesOf(data(), "alu")).toEqual(["left"]);
  });
});

describe("evaluate", () => {
  it("is correct when everything was left where it belongs", () => {
    const result = check([on("left", "alu"), on("right", "reg")]);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 2, possible: 2 });
  });

  it("gives a point for each element in the right place", () => {
    const result = check([on("left", "alu")]);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("charges a point for an element left on the wrong region", () => {
    const result = check([on("left", "alu"), on("left", "reg")]);

    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });

  it("keeps a wrong placement free when penalties are off", () => {
    const result = check([on("left", "alu"), on("left", "reg")], {
      applyPenalties: false,
    });

    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("never scores below zero", () => {
    const result = check([on("right", "alu"), on("left", "reg")]);

    expect(result.score).toEqual({ earned: 0, possible: 2 });
  });

  it("treats open ground as neither right nor wrong", () => {
    // Moving something to nowhere in particular is not an answer, so it is
    // not a mistake either — the same as never having moved it.
    const result = check([
      on("left", "alu"),
      { elementId: "reg", x: 0.3, y: 0.7 },
    ]);

    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("makes the whole task one point when the author asks for that", () => {
    expect(check([on("left", "alu")], { singlePoint: true }).score).toEqual({
      earned: 0,
      possible: 1,
    });
    expect(
      check([on("left", "alu"), on("right", "reg")], { singlePoint: true }).score,
    ).toEqual({ earned: 1, possible: 1 });
  });

  it("says of each element where it landed and whether that was right", () => {
    const result = check([on("left", "alu"), { elementId: "reg", x: 0.3, y: 0.7 }]);
    const detail = result.detail?.placements as ReturnType<typeof judge>;

    expect(detail[0]).toMatchObject({ elementId: "alu", zoneId: "left", state: "correct" });
    // Nothing under it, so no zone and no verdict.
    expect(detail[1].zoneId).toBeUndefined();
    expect(detail[1].state).toBeUndefined();
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
