import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { contains, hotspotAt } from "./geometry";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Which of these is an input device?",
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
        feedback: "That is the monitor — it shows output rather than taking it in.",
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const choose = (x: number, y: number, over: Partial<Data> = {}) =>
  evaluate({ data: data(over), answer: { selection: { x, y } } });

describe("contains", () => {
  const rect = {
    id: "r",
    shape: "rect" as const,
    x: 0.2,
    y: 0.2,
    width: 0.4,
    height: 0.2,
    correct: true,
    label: "r",
  };

  it("accepts a point inside a rectangle and rejects one outside", () => {
    expect(contains(rect, { x: 0.3, y: 0.3 })).toBe(true);
    expect(contains(rect, { x: 0.7, y: 0.3 })).toBe(false);
  });

  it("treats an ellipse as the one drawn inside the same box", () => {
    const ellipse = { ...rect, shape: "ellipse" as const };

    // The middle is in, and so is the box's corner for a rectangle — but the
    // corner is outside the ellipse, which is the whole difference.
    expect(contains(ellipse, { x: 0.4, y: 0.3 })).toBe(true);
    expect(contains(rect, { x: 0.21, y: 0.21 })).toBe(true);
    expect(contains(ellipse, { x: 0.21, y: 0.21 })).toBe(false);
  });

  it("is not fooled by the picture's proportions", () => {
    // The ellipse is measured against its own axes, so a wide box is a wide
    // ellipse rather than a circle squashed by the image's aspect.
    const wide = { ...rect, shape: "ellipse" as const, width: 0.8, x: 0.1 };
    expect(contains(wide, { x: 0.85, y: 0.3 })).toBe(true);
    expect(contains(wide, { x: 0.5, y: 0.45 })).toBe(false);
  });

  it("refuses a region with no size", () => {
    expect(contains({ ...rect, width: 0 }, { x: 0.2, y: 0.3 })).toBe(false);
  });
});

describe("hotspotAt", () => {
  it("lets a region drawn later win, so an exception can be carved out", () => {
    const outer = {
      id: "outer",
      shape: "rect" as const,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      correct: false,
      label: "outer",
    };
    const inner = { ...outer, id: "inner", x: 0.4, y: 0.4, width: 0.2, height: 0.2 };

    expect(hotspotAt([outer, inner], { x: 0.5, y: 0.5 })?.id).toBe("inner");
    expect(hotspotAt([outer, inner], { x: 0.1, y: 0.1 })?.id).toBe("outer");
  });

  it("finds nothing on bare picture", () => {
    expect(hotspotAt([], { x: 0.5, y: 0.5 })).toBeUndefined();
  });
});

describe("evaluate", () => {
  it("is correct when the chosen spot is the one to find", () => {
    const result = choose(0.3, 0.7);

    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("is wrong when another region was chosen", () => {
    const result = choose(0.3, 0.2);

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 1 });
    expect(result.detail?.hotspotId).toBe("monitor");
  });

  it("carries the author's word about the spot that was chosen", () => {
    // On a wrong region this is the teaching, and worth more than a red cross.
    expect(choose(0.3, 0.2).detail?.feedback).toContain("shows output");
  });

  it("tells a miss apart from a wrong region", () => {
    const result = choose(0.9, 0.9);

    expect(result.detail?.missed).toBe(true);
    expect(result.detail?.hotspotId).toBeUndefined();
  });

  it("falls back to the author's word for bare picture", () => {
    const result = choose(0.9, 0.9, {
      missFeedback: "Nothing there — look at what you type on.",
    });

    expect(result.detail?.feedback).toContain("look at what you type on");
  });

  it("accepts any of several correct regions", () => {
    // "There can be multiple correct hotspots", as H5P puts it — as long as
    // some region is still wrong, or every answer would win.
    const twoRight = data({
      hotspots: [
        ...data().hotspots.map((hotspot) => ({ ...hotspot, correct: true })),
        {
          id: "printer",
          shape: "rect" as const,
          x: 0.6,
          y: 0.6,
          width: 0.2,
          height: 0.2,
          correct: false,
          label: "The printer",
        },
      ],
    });

    expect(
      evaluate({ data: twoRight, answer: { selection: { x: 0.3, y: 0.2 } } }).state,
    ).toBe("correct");
    expect(
      evaluate({ data: twoRight, answer: { selection: { x: 0.3, y: 0.7 } } }).state,
    ).toBe("correct");
  });

  it("is wrong, not unanswered, when nothing was chosen", () => {
    const result = evaluate({ data: data() });

    expect(result.state).toBe("wrong");
    expect(result.detail?.missed).toBe(false);
  });

  it("does not grade at all when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { ...defaultEvaluation(), mode: "skip" } }),
      answer: { selection: { x: 0.3, y: 0.7 } },
    });

    expect(result.state).toBe("unknown");
  });
});
