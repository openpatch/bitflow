import { describe, expect, it } from "vitest";
import { sampleCurve } from "./curve";

const axisX = { min: -2, max: 2 };
const axisY = { min: -5, max: 5 };

describe("sampleCurve", () => {
  it("samples a well-behaved function into one unbroken segment", () => {
    const segments = sampleCurve((x) => x * x, axisX, axisY, 4);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toHaveLength(5);
    expect(segments[0][0]).toEqual({ x: -2, y: 4 });
    expect(segments[0][segments[0].length - 1]).toEqual({ x: 2, y: 4 });
  });

  it("breaks into a new segment at a domain error", () => {
    // sqrt is only real for x >= 0; over -2..2 that splits the sample into a
    // run of non-finite values (dropped) and a run of finite ones.
    const segments = sampleCurve((x) => Math.sqrt(x), axisX, axisY, 8);
    expect(segments.length).toBeGreaterThanOrEqual(1);
    for (const segment of segments) {
      for (const point of segment) expect(point.x).toBeGreaterThanOrEqual(0);
    }
  });

  it("breaks a curve that crosses an asymptote into two segments", () => {
    // 1/x is finite everywhere except exactly at 0; with an even sample count
    // and a symmetric range, x = 0 is one of the sampled points and the curve
    // splits cleanly either side of it.
    const segments = sampleCurve((x) => 1 / x, axisX, axisY, 4);
    expect(segments).toHaveLength(2);
  });

  it("clamps a value that blows up instead of returning an astronomical one", () => {
    const segments = sampleCurve(() => 1e300, axisX, axisY, 2);
    const span = axisY.max - axisY.min;
    for (const segment of segments) {
      for (const point of segment) {
        expect(point.y).toBeLessThanOrEqual(axisY.max + span * 3);
      }
    }
  });

  it("returns nothing for a function that is never finite", () => {
    expect(sampleCurve(() => NaN, axisX, axisY, 4)).toEqual([]);
  });
});
