import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Paint the letter I.",
  rows: 3,
  columns: 3,
  palette: [
    { id: "white", color: "#ffffff", label: "0" },
    { id: "black", color: "#000000", label: "1" },
  ],
  target: [
    ["white", "black", "white"],
    ["white", "black", "white"],
    ["white", "black", "white"],
  ],
  given: [],
  startColor: "white",
  showCoordinates: true,
  showLabels: false,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-pixel-grid>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-pixel-grid")).toBeDefined();
  });

  it("draws a cell per pixel and a swatch per colour", async () => {
    const element = document.createElement("bitflow-task-pixel-grid") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelectorAll('[role="gridcell"]')).toHaveLength(9);
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });
});
