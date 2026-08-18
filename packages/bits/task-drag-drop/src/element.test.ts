import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Label the diagram.",
  background: { src: "/cpu.png", alt: "A CPU diagram" },
  elements: [
    { id: "alu", label: "ALU", x: 0.05, y: 0.05, width: 0.2, height: 0.1 },
    { id: "reg", label: "Registers", x: 0.05, y: 0.2, width: 0.2, height: 0.1 },
  ],
  dropZones: [
    {
      id: "left",
      label: "Left block",
      x: 0.4,
      y: 0.05,
      width: 0.25,
      height: 0.2,
      correctElementIds: ["alu"],
    },
    {
      id: "right",
      label: "Right block",
      x: 0.7,
      y: 0.05,
      width: 0.25,
      height: 0.2,
      correctElementIds: ["reg"],
    },
  ],
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

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-drag-drop>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-drag-drop")).toBeDefined();
  });

  it("reports a move through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const alu = [...element.querySelectorAll("button")].find(
      (candidate) => candidate.getAttribute("aria-label") === "ALU",
    )!;
    alu.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await flush();

    // A position, because nothing snaps: the region it may or may not be over
    // is worked out at marking time.
    const answer = listener.mock.calls[0][0].detail.answer;
    expect(answer.placements).toHaveLength(1);
    expect(answer.placements[0].elementId).toBe("alu");
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("gives every element a tab stop, and never the regions", async () => {
    const element = await mount();

    // The regions decide the marking and are not part of the interface: a
    // learner with a keyboard must not be able to find what nobody can see.
    const reachable = [...element.querySelectorAll("button")]
      .filter((candidate) => !candidate.disabled)
      .map((candidate) => candidate.getAttribute("aria-label"));

    expect(reachable).toEqual(expect.arrayContaining(["ALU", "Registers"]));
    expect(reachable).not.toContain("Left block");
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        placements: [
          { elementId: "alu", x: 0.45, y: 0.1 },
          { elementId: "reg", x: 0.75, y: 0.1 },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
