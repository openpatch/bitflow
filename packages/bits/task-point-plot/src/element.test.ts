import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Assign each point to its nearest centre.",
  axes: { x: { label: "x", min: 0, max: 10 }, y: { label: "y", min: 0, max: 10 } },
  classes: [
    { id: "a", label: "A", color: "#017460", shape: "circle" },
    { id: "b", label: "B", color: "#a3282d", shape: "square" },
  ],
  points: [
    { id: "ca", x: 2, y: 2, class: "a", centroid: true },
    { id: "cb", x: 8, y: 8, class: "b", centroid: true },
    { id: "p1", x: 3, y: 1, expected: "a" },
  ],
  showGrid: true,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-point-plot>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-point-plot")).toBeDefined();
  });

  it("draws the plot, a swatch per class and a select per open point", async () => {
    const element = document.createElement("bitflow-task-point-plot") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelector("svg.bitflow-point-plot-diagram")).not.toBeNull();
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(2);
    expect(element.querySelectorAll("select")).toHaveLength(1);
    expect(element.querySelectorAll(".bitflow-point-plot-centroid")).toHaveLength(2);
  });
});
