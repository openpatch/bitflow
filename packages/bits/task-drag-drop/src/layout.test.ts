import { describe, expect, it } from "vitest";
import { inside } from "./layout";

describe("inside", () => {
  const box = { x: 0.2, y: 0.2, width: 0.2, height: 0.2 };

  it("accepts a point within the box", () => {
    expect(inside(box, { x: 0.3, y: 0.3 })).toBe(true);
  });

  it("rejects one outside it", () => {
    expect(inside(box, { x: 0.5, y: 0.3 })).toBe(false);
    expect(inside(box, { x: 0.3, y: 0.1 })).toBe(false);
  });

  it("counts the edge as inside", () => {
    expect(inside(box, { x: 0.4, y: 0.4 })).toBe(true);
  });
});
