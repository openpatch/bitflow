import { describe, expect, it } from "vitest";
import { DataSchema, distanceBetween, indexOfDifficulty } from "./schema";

const messages = (over: Record<string, unknown> = {}) =>
  (
    DataSchema.safeParse({
      aspectRatio: 1,
      targets: [{ id: "a", x: 0.5, y: 0.5, radius: 0.1 }],
      ...over,
    }).error?.issues ?? []
  ).map((issue) => issue.message);

describe("DataSchema", () => {
  it("accepts a target inside the area", () => {
    expect(messages()).toEqual([]);
  });

  it("refuses a target hanging over the edge", () => {
    // Part of it could not be clicked, so part of the task is unwinnable.
    expect(messages({ targets: [{ id: "a", x: 0.95, y: 0.5, radius: 0.1 }] }).join(" ")).toMatch(
      /over the edge/i,
    );
  });

  it("refuses two targets with the same id", () => {
    expect(
      messages({
        targets: [
          { id: "a", x: 0.3, y: 0.5, radius: 0.05 },
          { id: "a", x: 0.7, y: 0.5, radius: 0.05 },
        ],
      }).join(" "),
    ).toMatch(/its own id/i);
  });

  it("asks for at least one target", () => {
    expect(messages({ targets: [] }).join(" ")).toMatch(/at least one target/i);
  });

  it("says nothing about the targets when nothing is being marked", () => {
    expect(messages({ targets: [], evaluation: { mode: "skip" } })).toEqual([]);
  });

  it("lets the learner stand down unless the author says otherwise", () => {
    expect(DataSchema.parse({ targets: [] , evaluation: { mode: "skip" }}).allowOptOut).toBe(true);
  });
});

describe("distanceBetween", () => {
  it("measures across a square area as the pointer travels", () => {
    expect(distanceBetween({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, 1)).toBeCloseTo(0.6, 5);
  });

  it("scales the vertical by the shape of the area", () => {
    // Half the width and half as tall is a shorter move than half the width
    // across, and a distance that ignored that would not be a distance.
    expect(distanceBetween({ x: 0, y: 0 }, { x: 0, y: 1 }, 0.5)).toBeCloseTo(0.5, 5);
  });
});

describe("indexOfDifficulty", () => {
  it("is Fitts's law", () => {
    expect(indexOfDifficulty(0.3, 0.1)).toBeCloseTo(Math.log2(0.6 / 0.1 + 1), 10);
  });

  it("is nothing for a target with no width", () => {
    expect(indexOfDifficulty(0.3, 0)).toBe(0);
  });
});
