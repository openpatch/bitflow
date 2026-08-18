import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Put the steps in order.",
  items: [
    { id: "a", kind: "text", label: "Read the input" },
    { id: "b", kind: "text", label: "Sort it" },
    { id: "c", kind: "text", label: "Print the result" },
  ],
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-ordering") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

const rows = (element: HTMLElement) =>
  [...element.querySelectorAll(".bitflow-ordering-item")].map((row) =>
    (row.getAttribute("aria-label") ?? "").split(",")[0],
  );

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-ordering>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-ordering")).toBeDefined();
  });

  it("does not deal the items in their answered order", async () => {
    const element = await mount();

    // A shuffle that happens to be correct hands out a full mark for doing
    // nothing.
    expect(rows(element)).not.toEqual([
      "Read the input",
      "Sort it",
      "Print the result",
    ]);
  });

  it("reports a reorder through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const first = element.querySelector(".bitflow-ordering-item") as HTMLElement;
    first.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    await flush();

    expect(listener.mock.calls[0][0].detail.answer.order).toHaveLength(3);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { order: ["a", "b", "c"] },
    });

    expect(result.state).toBe("correct");
  });
});
