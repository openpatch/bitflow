import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Match each term to its meaning.",
  pairs: [
    {
      id: "cpu",
      left: { kind: "text", label: "CPU" },
      right: { kind: "text", label: "Carries out instructions" },
    },
    {
      id: "ram",
      left: { kind: "text", label: "RAM" },
      right: { kind: "text", label: "Holds what is being worked on" },
    },
  ],
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-matching") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

const cardNamed = (element: HTMLElement, start: string) =>
  [...element.querySelectorAll(".bitflow-matching-card")].find((card) =>
    (card.getAttribute("aria-label") ?? "").startsWith(start),
  ) as HTMLElement;

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-matching>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-matching")).toBeDefined();
  });

  it("reports a pairing through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    cardNamed(element, "CPU").click();
    await flush();
    cardNamed(element, "Carries out").click();
    await flush();

    expect(listener.mock.calls[0][0].detail.answer.matches).toEqual([
      { leftId: "cpu", rightId: "cpu" },
    ]);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("shuffles the two columns apart", async () => {
    const element = await mount();

    // Lined up row against row, the task would be "match one to one".
    const cards = [...element.querySelectorAll(".bitflow-matching-column")].map(
      (column) =>
        [...column.querySelectorAll(".bitflow-matching-card")].map(
          (card) => (card.getAttribute("aria-label") ?? "").split(",")[0],
        ),
    );
    expect(cards[0]).toHaveLength(2);
    expect(cards[1]).toHaveLength(2);
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        matches: [
          { leftId: "cpu", rightId: "cpu" },
          { leftId: "ram", rightId: "ram" },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
