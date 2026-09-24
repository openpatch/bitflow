import { describe, expect, it } from "vitest";
import {
  formatValue,
  keyboardStepFor,
  minorStepFor,
  snapStepFor,
  snapValue,
  stackLabels,
  ticksFor,
  valueToView,
  viewToValue,
} from "./line";
import { DataSchema, type Data } from "./schema";

const line = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    items: [{ id: "a", label: "A", value: 0 }],
    ...over,
  });

describe("valueToView / viewToValue", () => {
  const data = line({ min: -2, max: 2 });

  it("round-trip", () => {
    expect(viewToValue(data, valueToView(data, 0.75))).toBeCloseTo(0.75);
    expect(viewToValue(data, valueToView(data, -1.5))).toBeCloseTo(-1.5);
  });

  it("draws min to the left of max, the same order as reading", () => {
    expect(valueToView(data, data.min)).toBeLessThan(valueToView(data, data.max));
  });
});

describe("minorStepFor", () => {
  it("is the tick step itself with no minor ticks", () => {
    expect(minorStepFor({ tickStep: 1, minorTicks: 0 })).toBe(1);
  });

  it("divides the tick step into minorTicks + 1 parts", () => {
    expect(minorStepFor({ tickStep: 1, minorTicks: 3 })).toBeCloseTo(0.25);
  });
});

describe("snapStepFor", () => {
  const data = { tickStep: 1, minorTicks: 3 };

  it("is undefined for 'none'", () => {
    expect(snapStepFor(data, "none")).toBeUndefined();
  });

  it("is the tick step for 'major'", () => {
    expect(snapStepFor(data, "major")).toBe(1);
  });

  it("is the minor step for 'minor'", () => {
    expect(snapStepFor(data, "minor")).toBeCloseTo(0.25);
  });

  it("'minor' with no minor ticks is the same as 'major'", () => {
    expect(snapStepFor({ tickStep: 1, minorTicks: 0 }, "minor")).toBe(1);
  });
});

describe("keyboardStepFor", () => {
  it("falls back to the finest tick when snap is 'none'", () => {
    const data = line({ tickStep: 1, minorTicks: 3, snap: "none" });
    expect(keyboardStepFor(data)).toBeCloseTo(0.25);
  });
});

describe("snapValue", () => {
  it("snaps to the minor step by default", () => {
    const data = line({ min: 0, max: 1, tickStep: 1, minorTicks: 3 }); // step 0.25
    expect(snapValue(data, 0.4)).toBeCloseTo(0.5);
    expect(snapValue(data, 0.34)).toBeCloseTo(0.25);
  });

  it("snaps to the major tick only when asked", () => {
    const data = line({ min: 0, max: 4, tickStep: 1, minorTicks: 3, snap: "major" });
    expect(snapValue(data, 1.4)).toBe(1);
  });

  it("keeps the exact value when snap is 'none'", () => {
    const data = line({ min: 0, max: 1, snap: "none" });
    expect(snapValue(data, 0.123456)).toBeCloseTo(0.123456);
  });

  it("clamps to the line's ends", () => {
    const data = line({ min: 0, max: 1 });
    expect(snapValue(data, -5)).toBe(0);
    expect(snapValue(data, 5)).toBe(1);
  });
});

describe("ticksFor", () => {
  it("anchors the major ticks at min", () => {
    const data = line({ min: -2, max: 2, tickStep: 1 });
    expect(ticksFor(data).major).toEqual([-2, -1, 0, 1, 2]);
  });

  it("adds minor ticks between the major ones, skipping the ones already drawn", () => {
    const data = line({ min: 0, max: 2, tickStep: 1, minorTicks: 1 });
    expect(ticksFor(data).minor).toEqual([0.5, 1.5]);
  });

  it("draws nothing extra with no minor ticks", () => {
    const data = line({ min: 0, max: 2, tickStep: 1, minorTicks: 0 });
    expect(ticksFor(data).minor).toEqual([]);
  });

  it("never loops forever on a step that cannot advance", () => {
    // A schema-valid document never has this shape, but the authoring
    // preview draws whatever is currently typed, mid-edit.
    const data = { ...line(), tickStep: 0 };
    expect(ticksFor(data).major.length).toBeLessThan(10);
  });
});

describe("formatValue", () => {
  it("drops float noise", () => {
    expect(formatValue(0.1 + 0.2)).toBe("0.3");
  });

  it("keeps a negative sign", () => {
    expect(formatValue(-0.75)).toBe("-0.75");
  });
});

describe("stackLabels", () => {
  it("keeps distant labels on the same lane", () => {
    const lanes = stackLabels(
      [
        { id: "a", view: 0 },
        { id: "b", view: 500 },
      ],
      70,
    );
    expect(lanes).toEqual({ a: 0, b: 0 });
  });

  it("stacks labels that would overlap", () => {
    const lanes = stackLabels(
      [
        { id: "a", view: 0 },
        { id: "b", view: 20 },
      ],
      70,
    );
    expect(lanes.a).toBe(0);
    expect(lanes.b).toBe(1);
  });

  it("is not thrown off by input order", () => {
    const lanes = stackLabels(
      [
        { id: "b", view: 20 },
        { id: "a", view: 0 },
      ],
      70,
    );
    expect(lanes.a).toBe(0);
    expect(lanes.b).toBe(1);
  });
});
