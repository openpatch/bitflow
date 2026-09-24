import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { xFromView, xToView, yFromView, yToView } from "./plot";
import { DataSchema, roleOf, type Data } from "./schema";

const kmeans = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    classes: [
      { id: "a", label: "Cluster A", color: "#017460", shape: "circle" },
      { id: "b", label: "Cluster B", color: "#a3282d", shape: "square" },
    ],
    points: [
      { id: "ca", x: 2, y: 2, class: "a", centroid: true },
      { id: "cb", x: 8, y: 8, class: "b", centroid: true },
      { id: "p1", x: 1, y: 3, expected: "a" },
      { id: "p2", x: 9, y: 7, expected: "b" },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("DataSchema", () => {
  it("fills in axes left out entirely", () => {
    expect(kmeans().axes).toEqual({
      x: { label: "", min: 0, max: 10 },
      y: { label: "", min: 0, max: 10 },
    });
  });

  it("refuses a point outside its axes", () => {
    const result = DataSchema.safeParse({
      ...kmeans(),
      points: [...kmeans().points, { id: "far", x: 11, y: 1, expected: "a" }],
    });
    expect(result.success).toBe(false);
  });

  it("refuses an open point that also carries a known class", () => {
    const result = DataSchema.safeParse({
      ...kmeans(),
      points: [{ id: "both", x: 1, y: 1, class: "a", expected: "a" }],
    });
    expect(result.success).toBe(false);
  });

  it("wants something open to classify", () => {
    const result = DataSchema.safeParse({
      ...kmeans(),
      points: kmeans().points.filter((point) => roleOf(point) !== "open"),
    });
    expect(result.success).toBe(false);
  });
});

describe("evaluate", () => {
  it("gives a point per open point with partial credit", () => {
    const result = evaluate({ data: kmeans(), answer: { assignments: { p1: "a", p2: "a" } } });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
  });

  it("counts an unassigned point as wrong", () => {
    expect(evaluate({ data: kmeans(), answer: { assignments: { p1: "a" } } }).state).toBe(
      "wrong",
    );
  });

  it("is correct when every open point is", () => {
    const result = evaluate({ data: kmeans(), answer: { assignments: { p1: "a", p2: "b" } } });
    expect(result.state).toBe("correct");
  });
});

describe("plot coordinates", () => {
  const axis = { label: "", min: 0, max: 10 };

  it("round-trips between axis units and the viewBox", () => {
    expect(xFromView(axis, xToView(axis, 3.5))).toBeCloseTo(3.5);
    expect(yFromView(axis, yToView(axis, 7))).toBeCloseTo(7);
  });

  it("draws a larger y higher up, as a plot on paper does", () => {
    expect(yToView(axis, 9)).toBeLessThan(yToView(axis, 1));
  });
});
