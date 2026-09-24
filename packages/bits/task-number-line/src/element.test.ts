import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Place each value on the line.",
  min: -2,
  max: 2,
  tickStep: 1,
  minorTicks: 3,
  labelTicks: true,
  items: [
    { id: "half", label: "1/2", value: 0.5 },
    { id: "neg", label: "-3/4", value: -0.75 },
  ],
  tolerance: 0.25,
  snap: "minor",
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-number-line>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-number-line")).toBeDefined();
  });

  it("draws the line and a chip per item", async () => {
    const element = document.createElement("bitflow-task-number-line") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelector("svg.bitflow-number-line-diagram")).not.toBeNull();
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });
});
