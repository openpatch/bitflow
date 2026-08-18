import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Which is an input device?",
  background: { src: "data:image/png;base64,AAAA", alt: "A workstation" },
  size: { width: 620, height: 310 },
  hotspots: [
    {
      id: "keyboard",
      shape: "rect",
      x: 0.2,
      y: 0.6,
      width: 0.3,
      height: 0.2,
      correct: true,
      label: "The keyboard",
    },
    {
      id: "monitor",
      shape: "rect",
      x: 0.2,
      y: 0.1,
      width: 0.3,
      height: 0.3,
      correct: false,
      label: "The monitor",
    },
  ],
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement(
    "bitflow-task-find-hotspots",
  ) as HTMLElement & Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-find-hotspots>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-find-hotspots")).toBeDefined();
  });

  it("reports a choice through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const surface = element.querySelector(
      ".bitflow-hotspots-surface",
    ) as HTMLElement;
    surface.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await flush();
    surface.dispatchEvent(
      new MouseEvent("click", { bubbles: true, detail: 0 }),
    );
    await flush();

    const answer = listener.mock.calls[0][0].detail.answer;
    expect(answer.selection).toBeDefined();
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("puts the picture in the tab order and the regions nowhere", async () => {
    const element = await mount();

    // The regions decide the marking and are not part of the interface: a
    // keyboard must not be able to find what nobody can see.
    // One control over the picture — the standalone element adds its own
    // Check button beside it — and no region is reachable at all.
    expect(
      element.querySelectorAll(".bitflow-hotspots-picture button"),
    ).toHaveLength(1);
    expect(element.querySelectorAll(".bitflow-hotspots-handle")).toHaveLength(0);
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { selection: { x: 0.3, y: 0.7 } },
    });

    expect(result.state).toBe("correct");
  });
});
