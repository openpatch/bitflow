import { defaultEvaluation } from "@bitflow/core";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Label the diagram.",
  background: { src: "/cpu.png", alt: "A CPU diagram" },
  items: [
    { id: "alu", kind: "text", label: "ALU" },
    { id: "reg", kind: "text", label: "Registers" },
  ],
  zones: [
    {
      id: "alu-zone",
      label: "Arithmetic logic unit",
      rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      acceptedItemIds: ["alu"],
      score: 1,
    },
    {
      id: "reg-zone",
      label: "Register file",
      rect: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
      acceptedItemIds: ["reg"],
      score: 1,
    },
  ],
  allowMultiplePlacements: false,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-drag-drop") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

const button = (element: HTMLElement, name: string) =>
  [...element.querySelectorAll("button")].find(
    (candidate) =>
      candidate.getAttribute("aria-label") === name ||
      candidate.textContent?.trim() === name,
  );

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-drag-drop>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-drag-drop")).toBeDefined();
  });

  it("reports a placement through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const user = userEvent.setup();
    await user.click(button(element, "ALU")!);
    await user.click(button(element, "Arithmetic logic unit, empty")!);
    await flush();

    expect(listener.mock.calls[0][0].detail.answer).toEqual({
      placements: [{ itemId: "alu", zoneId: "alu-zone" }],
    });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("puts every region and every label in the tab order", async () => {
    const element = await mount();

    // The whole task is reachable without a pointer, which is the point of
    // pick-up-then-choose rather than a drag gesture.
    const reachable = [...element.querySelectorAll("button")]
      .filter((candidate) => !candidate.disabled)
      .map(
        (candidate) =>
          candidate.getAttribute("aria-label") ?? candidate.textContent?.trim(),
      );

    expect(reachable).toEqual(
      expect.arrayContaining([
        "ALU",
        "Registers",
        "Arithmetic logic unit, empty",
        "Register file, empty",
      ]),
    );
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        placements: [
          { itemId: "alu", zoneId: "alu-zone" },
          { itemId: "reg", zoneId: "reg-zone" },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
