import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Arrange the lines to add up a list.",
  language: "python",
  lines: [
    { id: "total", text: "total = 0", indent: 0 },
    { id: "loop", text: "for value in values:", indent: 0 },
    { id: "add", text: "total += value", indent: 1 },
    { id: "stray", text: "print(values)", distractor: true },
  ],
  indentationMatters: true,
  penaliseDistractors: false,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-parsons") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

const bank = (element: HTMLElement) =>
  [...element.querySelectorAll(".bitflow-parsons-line")].map(
    (node) => node.textContent ?? "",
  );

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-parsons>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-parsons")).toBeDefined();
  });

  it("does not deal the lines already solved", async () => {
    const element = await mount();

    // A puzzle that starts solved hands out full marks for doing nothing.
    expect(bank(element).slice(0, 3)).not.toEqual([
      "total = 0",
      "for value in values:",
      "total += value",
    ]);
  });

  it("reports a placement through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    (element.querySelector(".bitflow-parsons-line") as HTMLElement).click();
    await flush();

    expect(listener.mock.calls[0][0].detail.answer.lines).toHaveLength(1);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders the code as text and never runs it", async () => {
    const element = await mount({
      data: {
        ...data,
        // Indentation off, or a puzzle whose lines are all at the margin is
        // refused by the schema and nothing renders at all.
        indentationMatters: false,
        lines: [
          { id: "a", text: "<script>window.ran = true</script>", indent: 0 },
          { id: "b", text: "total = 0", indent: 0 },
        ],
      },
    });

    // Code is content, not markup: a `.bitflow` file can come from anywhere.
    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
    expect(bank(element).join()).toContain("<script>");
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        lines: [
          { lineId: "total", indent: 0 },
          { lineId: "loop", indent: 0 },
          { lineId: "add", indent: 1 },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
