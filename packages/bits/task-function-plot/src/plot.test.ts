import { describe, expect, it } from "vitest";
import {
  defaultHandles,
  defaultHandleValue,
  formatTick,
  labelledTicks,
  snapValue,
  ticksFor,
  xFromView,
  xToView,
  yFromView,
  yToView,
} from "./plot";
import type { Axis } from "./schema";

const axis: Axis = { label: "", min: -5, max: 5, step: 1 };

describe("coordinate mapping", () => {
  it("round-trips between axis units and the viewBox", () => {
    expect(xFromView(axis, xToView(axis, 3.5))).toBeCloseTo(3.5);
    expect(yFromView(axis, yToView(axis, -2))).toBeCloseTo(-2);
  });

  it("draws a larger y higher up, as a plot on paper does", () => {
    expect(yToView(axis, 4)).toBeLessThan(yToView(axis, -4));
  });

  it("draws a larger x further right", () => {
    expect(xToView(axis, 4)).toBeGreaterThan(xToView(axis, -4));
  });
});

describe("ticksFor", () => {
  it("places a tick at every step across the axis", () => {
    expect(ticksFor({ label: "", min: 0, max: 4, step: 1 })).toEqual([0, 1, 2, 3, 4]);
  });

  it("honours a fractional step", () => {
    expect(ticksFor({ label: "", min: 0, max: 1, step: 0.5 })).toEqual([0, 0.5, 1]);
  });
});

describe("formatTick", () => {
  it("drops float noise without adding a needless .0", () => {
    expect(formatTick(0.1 + 0.2)).toBe("0.3");
    expect(formatTick(3)).toBe("3");
  });
});

describe("defaultHandles", () => {
  it("spreads handles evenly across the axis, endpoints included", () => {
    expect(defaultHandles({ min: -4, max: 4 }, 5)).toEqual([-4, -2, 0, 2, 4]);
  });

  it("falls back to the midpoint for a single handle", () => {
    expect(defaultHandles({ min: 0, max: 10 }, 1)).toEqual([5]);
  });
});

describe("defaultHandleValue", () => {
  it("starts at zero when the axis contains it", () => {
    expect(defaultHandleValue({ min: -5, max: 5 })).toBe(0);
  });

  it("starts at the midpoint when zero is out of range", () => {
    expect(defaultHandleValue({ min: 2, max: 8 })).toBe(5);
  });
});

describe("snapValue", () => {
  it("clamps to the axis without rounding when snap is none", () => {
    expect(snapValue(axis, 12, "none")).toBe(5);
    expect(snapValue(axis, 1.23, "none")).toBe(1.23);
  });

  it("rounds to a whole step when snap is grid", () => {
    expect(snapValue(axis, 2.3, "grid")).toBe(2);
    expect(snapValue(axis, 2.6, "grid")).toBe(3);
  });

  it("rounds to half a step when snap is half", () => {
    expect(snapValue(axis, 2.2, "half")).toBe(2);
    expect(snapValue(axis, 2.3, "half")).toBe(2.5);
  });

  it("never returns a value outside the axis", () => {
    expect(snapValue(axis, -100, "half")).toBe(-5);
    expect(snapValue(axis, 100, "grid")).toBe(5);
  });
});

describe("labelledTicks", () => {
  it("keeps every label while they fit", () => {
    expect(labelledTicks([0, 1, 2], 1, 8)).toEqual([0, 1, 2]);
  });

  it("thins a crowded axis to round numbers, keeping zero", () => {
    const ticks = Array.from({ length: 15 }, (_, index) => index - 7);
    expect(labelledTicks(ticks, 1, 8)).toEqual([-6, -4, -2, 0, 2, 4, 6]);
  });
});
