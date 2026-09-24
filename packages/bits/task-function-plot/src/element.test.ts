import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Sketch the parabola.",
  axes: {
    x: { label: "x", min: -4, max: 4, step: 1 },
    y: { label: "y", min: -3, max: 6, step: 1 },
  },
  target: "0.5x^2 - 2",
  shown: [],
  handles: [-4, -2, 0, 2, 4],
  tolerance: 0.5,
  snap: "half",
  partialCredit: true,
  evaluation: { mode: "auto", enableRetry: true, showFeedback: true },
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-function-plot>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-function-plot")).toBeDefined();
  });

  it("draws the plot and a number field per handle", async () => {
    const element = document.createElement("bitflow-task-function-plot") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelector("svg.bitflow-function-plot-diagram")).not.toBeNull();
    expect(element.querySelectorAll(".bitflow-function-plot-row")).toHaveLength(5);
    expect(element.querySelectorAll('[role="slider"]')).toHaveLength(5);
  });
});
