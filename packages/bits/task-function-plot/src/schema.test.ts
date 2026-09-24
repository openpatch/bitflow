import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";

const parabola = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    axes: {
      x: { label: "x", min: -4, max: 4, step: 1 },
      y: { label: "y", min: -3, max: 6, step: 1 },
    },
    target: "0.5x^2 - 2",
    handles: [-4, -2, 0, 2, 4],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("DataSchema defaults", () => {
  it("fills in five handles evenly spread across the x‑axis when none are given", () => {
    const data = DataSchema.parse({
      axes: { x: { min: -4, max: 4 }, y: { min: -3, max: 6 } },
      target: "0",
    });
    expect(data.handles).toEqual([-4, -2, 0, 2, 4]);
  });

  it("fills in tolerance as half the y‑axis step when left unset", () => {
    const data = DataSchema.parse({ axes: { y: { step: 2 } }, target: "0" });
    expect(data.tolerance).toBe(1);
  });

  it("keeps an author's own tolerance instead of computing one", () => {
    const data = DataSchema.parse({ target: "0", tolerance: 0 });
    expect(data.tolerance).toBe(0);
  });

  it("keeps an author's own handles instead of spreading new ones", () => {
    const data = parabola({ handles: [-1, 1] });
    expect(data.handles).toEqual([-1, 1]);
  });
});

describe("DataSchema validation", () => {
  it("accepts a well-formed parabola", () => {
    expect(() => parabola()).not.toThrow();
  });

  it("refuses an x‑axis with max at or below min", () => {
    const result = DataSchema.safeParse({
      ...parabola(),
      axes: { ...parabola().axes, x: { min: 4, max: 4 } },
    });
    expect(result.success).toBe(false);
  });

  it("refuses a y‑axis with max at or below min", () => {
    const result = DataSchema.safeParse({
      ...parabola(),
      axes: { ...parabola().axes, y: { min: 6, max: 6 } },
    });
    expect(result.success).toBe(false);
  });

  it("refuses more than 15 handles", () => {
    const result = DataSchema.safeParse({
      ...parabola(),
      handles: Array.from({ length: 16 }, (_, i) => i),
      axes: { x: { min: 0, max: 20 }, y: { min: -50, max: 50 } },
      target: "0",
    });
    expect(result.success).toBe(false);
  });

  it("refuses two handles at the same x", () => {
    const result = DataSchema.safeParse({ ...parabola(), handles: [0, 0, 1] });
    expect(result.success).toBe(false);
  });

  it("refuses a handle outside the x‑axis", () => {
    const result = DataSchema.safeParse({ ...parabola(), handles: [-4, 0, 10] });
    expect(result.success).toBe(false);
  });

  it("refuses a target that is not arithmetic", () => {
    const result = DataSchema.safeParse({ ...parabola(), target: "x +" });
    expect(result.success).toBe(false);
  });

  it("refuses a target that goes out of the y‑axis at a handle", () => {
    // 0.5 * 4^2 - 2 = 6, which is exactly the y max; 0.5*5^2-2 would not be,
    // but here widen x so a handle sits where the parabola overshoots.
    const result = DataSchema.safeParse({
      ...parabola(),
      axes: { x: { min: -6, max: 6 }, y: { min: -3, max: 6 } },
      handles: [-6, 0, 6],
    });
    expect(result.success).toBe(false);
  });

  it("ignores an unparsable target when evaluation is skipped", () => {
    const result = DataSchema.safeParse({
      ...parabola(),
      target: "not arithmetic +",
      evaluation: { ...defaultEvaluation(), mode: "skip" },
    });
    expect(result.success).toBe(true);
  });

  it("refuses a shown curve that does not parse at a handle", () => {
    const result = DataSchema.safeParse({
      ...parabola(),
      shown: [{ expression: "x +", label: "f" }],
    });
    expect(result.success).toBe(false);
  });

  it("allows a shown curve to leave the y‑axis", () => {
    // 10x is far outside y (-3..6) at every non-zero handle, but shown curves
    // are never required to stay inside it — only the target is.
    const result = DataSchema.safeParse({
      ...parabola(),
      shown: [{ expression: "10x", label: "steep" }],
    });
    expect(result.success).toBe(true);
  });
});
