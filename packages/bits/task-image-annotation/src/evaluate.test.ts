import { describe, expect, it } from "vitest";
import { evaluate, extras, outcomes } from "./evaluate";
import { lands, named, overlapOf } from "./geometry";
import {
  DataSchema,
  type Annotation,
  type Answer,
  type Data,
  type Region,
} from "./schema";

const region = (over: Partial<Region> = {}): Region => ({
  id: "r",
  kind: "circle",
  x: 0.5,
  y: 0.5,
  radius: 0.05,
  width: 0.2,
  height: 0.2,
  label: "the middle",
  acceptedLabels: [],
  ...over,
});

const mark = (over: Partial<Annotation> = {}): Annotation => ({
  id: "m",
  kind: "point",
  x: 0.5,
  y: 0.5,
  width: 0,
  height: 0,
  label: "",
  ...over,
});

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Mark the middle.",
    background: { src: "data:image/png;base64,x", alt: "A square" },
    regions: [region()],
    maximumCount: 1,
    ...over,
  });

const answer = (...marks: Annotation[]): Answer => ({ annotations: marks });

describe("overlapOf", () => {
  it("is 1 for the same box and 0 for boxes that do not touch", () => {
    const box = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    expect(overlapOf(box, box)).toBeCloseTo(1, 10);
    expect(overlapOf(box, { x: 0.5, y: 0.5, width: 0.2, height: 0.2 })).toBe(0);
  });

  /**
   * The reason it is the shared area over the union rather than "is the middle
   * inside": a box round the whole picture contains every centre, and it is
   * not an outline of anything.
   */
  it("counts a box round everything as a poor match", () => {
    const small = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 };
    const everything = { x: 0, y: 0, width: 1, height: 1 };
    expect(overlapOf(small, everything)).toBeCloseTo(0.04, 5);
  });

  it("is a half when one box is half the other and inside it", () => {
    expect(
      overlapOf(
        { x: 0, y: 0, width: 0.4, height: 0.2 },
        { x: 0, y: 0, width: 0.2, height: 0.2 },
      ),
    ).toBeCloseTo(0.5, 5);
  });
});

describe("lands", () => {
  it("takes a point inside the distance a spot allows", () => {
    expect(lands(mark({ x: 0.52, y: 0.52 }), region(), data())).toBe(true);
    expect(lands(mark({ x: 0.7, y: 0.5 }), region(), data())).toBe(false);
  });

  it("takes a point inside an area", () => {
    const area = region({ kind: "rect", x: 0.1, y: 0.1, width: 0.4, height: 0.4 });
    expect(lands(mark({ x: 0.2, y: 0.2 }), area, data())).toBe(true);
    expect(lands(mark({ x: 0.6, y: 0.2 }), area, data())).toBe(false);
  });

  /** "Outline it" and "mark the spot" are not the same question. */
  it("judges a box against a spot by where its middle is", () => {
    const box = mark({ kind: "rect", x: 0.45, y: 0.45, width: 0.1, height: 0.1 });
    expect(lands(box, region(), data())).toBe(true);
  });

  it("judges a box against an area by how much of it is right", () => {
    const area = region({ kind: "rect", x: 0.2, y: 0.2, width: 0.4, height: 0.4 });
    const close = mark({ kind: "rect", x: 0.22, y: 0.22, width: 0.4, height: 0.4 });
    const wild = mark({ kind: "rect", x: 0, y: 0, width: 1, height: 1 });

    expect(lands(close, area, data({ overlap: 0.5 }))).toBe(true);
    expect(lands(wild, area, data({ overlap: 0.5 }))).toBe(false);
  });
});

describe("named", () => {
  it("asks nothing when no name is wanted", () => {
    expect(named(mark(), region(), data())).toBe(true);
  });

  it("takes the region's own name", () => {
    const withNames = data({ requireLabel: true });
    expect(named(mark({ label: "the middle" }), region(), withNames)).toBe(true);
    expect(named(mark({ label: "the edge" }), region(), withNames)).toBe(false);
  });

  it("takes a synonym the author allowed", () => {
    const withNames = data({ requireLabel: true });
    expect(
      named(mark({ label: "centre" }), region({ acceptedLabels: ["centre"] }), withNames),
    ).toBe(true);
  });

  it("ignores capitals and spaces unless told not to", () => {
    expect(named(mark({ label: " The Middle " }), region(), data({ requireLabel: true }))).toBe(
      true,
    );
    expect(
      named(
        mark({ label: "the middle" }),
        region(),
        data({ requireLabel: true, caseSensitive: true }),
      ),
    ).toBe(true);
    expect(
      named(
        mark({ label: "The Middle" }),
        region(),
        data({ requireLabel: true, caseSensitive: true }),
      ),
    ).toBe(false);
  });

  it("is not met by leaving the name empty", () => {
    expect(named(mark({ label: "  " }), region(), data({ requireLabel: true }))).toBe(
      false,
    );
  });
});

describe("outcomes", () => {
  /**
   * Each region takes one mark and each mark answers one region, so covering
   * the picture cannot collect every point.
   */
  it("gives one region only one mark", () => {
    const two = data({ maximumCount: 2 });
    const marks = outcomes(
      two,
      answer(mark({ id: "a" }), mark({ id: "b", x: 0.51, y: 0.51 })),
    );

    expect(marks).toHaveLength(1);
    expect(marks[0].annotationId).toBe("a");
    expect(extras(two, answer(mark({ id: "a" }), mark({ id: "b", x: 0.51, y: 0.51 })))).toHaveLength(
      1,
    );
  });

  /** Found it and called it something else is not the same as not finding it. */
  it("says when a mark is in the right place under the wrong name", () => {
    const withNames = data({ requireLabel: true });
    const marks = outcomes(withNames, answer(mark({ label: "the edge" })));

    expect(marks[0].annotationId).toBe("m");
    expect(marks[0].labelWrong).toBe(true);
  });

  it("prefers a mark that is named right over one that is not", () => {
    const withNames = data({ requireLabel: true, maximumCount: 2 });
    const marks = outcomes(
      withNames,
      answer(
        mark({ id: "wrong", label: "the edge" }),
        mark({ id: "right", x: 0.51, y: 0.51, label: "the middle" }),
      ),
    );

    expect(marks[0].annotationId).toBe("right");
    expect(marks[0].labelWrong).toBeUndefined();
  });

  it("names the region so the outcome can be read without the picture", () => {
    expect(outcomes(data(), answer())[0]).toEqual({
      regionId: "r",
      label: "the middle",
    });
  });
});

describe("evaluate", () => {
  it("marks a mark in the right place correct", () => {
    const result = evaluate({ data: data(), answer: answer(mark()) });

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("gives a point per region found", () => {
    const two = data({
      regions: [region({ id: "a" }), region({ id: "b", x: 0.2, y: 0.2 })],
      maximumCount: 2,
    });

    const result = evaluate({ data: two, answer: answer(mark({ id: "m1" })) });
    expect(result.score).toEqual({ earned: 1, possible: 2 });
    expect(result.state).toBe("wrong");
  });

  it("does not pay for a mark that is named wrongly", () => {
    const withNames = data({ requireLabel: true });
    const result = evaluate({
      data: withNames,
      answer: answer(mark({ label: "the edge" })),
    });

    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  /** Placing the right marks is the thing rewarded; caution is not the task. */
  it("costs nothing for a stray mark by default", () => {
    const two = data({ maximumCount: 2 });
    const result = evaluate({
      data: two,
      answer: answer(mark({ id: "a" }), mark({ id: "b", x: 0.1, y: 0.1 })),
    });

    expect(result.score).toEqual({ earned: 1, possible: 1 });
    // Still not a clean answer, and it says so.
    expect(result.state).toBe("wrong");
  });

  it("can charge for a stray mark instead", () => {
    const two = data({ maximumCount: 2, penaliseExtras: true });
    const result = evaluate({
      data: two,
      answer: answer(mark({ id: "a" }), mark({ id: "b", x: 0.1, y: 0.1 })),
    });

    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  /** A task cannot take marks off the rest of the assessment. */
  it("never goes below zero", () => {
    const many = data({ maximumCount: 5, penaliseExtras: true });
    const result = evaluate({
      data: many,
      answer: answer(
        mark({ id: "a", x: 0.1, y: 0.1 }),
        mark({ id: "b", x: 0.15, y: 0.1 }),
        mark({ id: "c", x: 0.2, y: 0.1 }),
      ),
    });

    expect(result.score?.earned).toBe(0);
  });

  it("scores nothing out of nothing when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { mode: "skip" } }),
      answer: answer(mark()),
    });

    expect(result.state).toBe("unknown");
    expect(result.score).toBeUndefined();
  });

  it("copes with no answer at all", () => {
    const result = evaluate({ data: data(), answer: undefined });

    expect(result.score).toEqual({ earned: 0, possible: 1 });
    expect(result.detail?.regions).toHaveLength(1);
  });
});
