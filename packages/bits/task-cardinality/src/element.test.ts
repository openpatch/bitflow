import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "A pupil borrows many books; a book is borrowed by one pupil at a time.",
  notation: "chen",
  entities: [
    { id: "pupil", name: "Pupil", x: 0.2, y: 0.5 },
    { id: "book", name: "Book", x: 0.8, y: 0.5 },
  ],
  relationships: [
    { id: "borrows", name: "borrows", from: "pupil", to: "book", expectedFrom: "1", expectedTo: "n" },
  ],
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-cardinality>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-cardinality")).toBeDefined();
  });

  it("draws the entities and a select per relationship end", async () => {
    const element = document.createElement("bitflow-task-cardinality") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelectorAll(".bitflow-cardinality-entity")).toHaveLength(2);
    expect(element.querySelectorAll("select")).toHaveLength(2);
  });
});
