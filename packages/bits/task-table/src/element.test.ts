import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "What does `SELECT name FROM pupils WHERE age > 15` return?",
  caption: "",
  columns: [{ id: "name", header: "name", kind: "text" }],
  rows: [
    { id: "r1", cells: { name: { accepted: ["Ada"] } } },
    { id: "r2", cells: { name: { accepted: ["Alan"] } } },
  ],
  rowHeaders: false,
  rowOrder: "any",
  caseSensitive: false,
  ignoreWhitespace: true,
  numberTolerance: 0,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-table>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-table")).toBeDefined();
  });

  it("draws an input per blank cell and says the row order is free", async () => {
    const element = document.createElement("bitflow-task-table") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelectorAll("input")).toHaveLength(2);
    expect(element.textContent).toContain("The order of the rows does not matter.");
  });
});
