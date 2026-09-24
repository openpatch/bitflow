import { describe, expect, it } from "vitest";
import { distance, knn, nearestCentroid } from "./classify";
import type { Point } from "./schema";

const point = (id: string, x: number, y: number, klass?: string, centroid = false): Point => ({
  id,
  x,
  y,
  class: klass,
  centroid,
});

describe("distance", () => {
  it("is Euclidean, in axis units", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("nearestCentroid", () => {
  const centres = [point("a", 1, 1, "red", true), point("b", 8, 8, "blue", true)];

  it("names the class of the closest centre", () => {
    expect(nearestCentroid(centres, { x: 2, y: 3 })).toBe("red");
    expect(nearestCentroid(centres, { x: 7, y: 6 })).toBe("blue");
  });

  it("breaks a tie by the order the centres were given in", () => {
    expect(nearestCentroid(centres, { x: 4.5, y: 4.5 })).toBe("red");
    expect(nearestCentroid([...centres].reverse(), { x: 4.5, y: 4.5 })).toBe("blue");
  });
});

describe("knn", () => {
  const known = [
    point("1", 1, 1, "red"),
    point("2", 2, 1, "red"),
    point("3", 6, 6, "blue"),
    point("4", 7, 6, "blue"),
    point("5", 6, 7, "blue"),
  ];

  it("takes the majority among the k nearest", () => {
    expect(knn(known, { x: 2, y: 2 }, 3)).toBe("red");
    expect(knn(known, { x: 5, y: 5 }, 3)).toBe("blue");
  });

  it("with k = 1 is the single nearest point's class", () => {
    expect(knn(known, { x: 3, y: 3 }, 1)).toBe("red");
  });

  it("breaks a tied vote by the nearest voter", () => {
    // k = 2 from (3.4, 3.4): red (2,1) and blue (6,6) — one vote each; red is nearer.
    expect(knn([point("r", 2, 1, "red"), point("b", 6, 6, "blue")], { x: 3.4, y: 3.4 }, 2)).toBe(
      "red",
    );
  });

  it("ignores points without a class", () => {
    expect(knn([point("x", 0, 0)], { x: 0, y: 0 }, 1)).toBeUndefined();
  });
});
