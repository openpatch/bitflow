import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Click each target as accurately as you can.",
  aspectRatio: 1,
  targets: [
    { id: "a", x: 0.25, y: 0.5, radius: 0.1 },
    { id: "b", x: 0.75, y: 0.5, radius: 0.1 },
  ],
  scoring: "hits",
  allowanceMs: 2000,
  allowOptOut: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-mouse-accuracy") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-mouse-accuracy>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-mouse-accuracy")).toBeDefined();
  });

  it("names the device it needs before anything starts", async () => {
    const element = await mount();

    expect(element.textContent).toMatch(/mouse, a trackpad or a touchscreen/i);
    expect(element.querySelector(".bitflow-mouse-area")).toBeNull();
  });

  it("reports a click through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    (
      [...element.querySelectorAll("button")].find((b) => b.textContent === "Start") as HTMLElement
    ).click();
    await flush();

    const area = element.querySelector(".bitflow-mouse-area") as HTMLElement;
    area.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
    area.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 200 }),
    );
    await flush();

    const round = listener.mock.calls[0][0].detail.answer.rounds[0];
    expect(round).toMatchObject({ targetId: "a", hit: true });
    // Nothing about the device, the window or the screen goes into an answer.
    expect(Object.keys(round).sort()).toEqual(["hit", "ms", "targetId", "x", "y"]);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        optedOut: false,
        rounds: [
          { targetId: "a", x: 0.25, y: 0.5, hit: true, ms: 300 },
          { targetId: "b", x: 0.75, y: 0.5, hit: true, ms: 350 },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
