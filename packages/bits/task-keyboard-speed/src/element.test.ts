import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const TEXT = "the quick brown fox";

const data = {
  instruction: "Type the passage.",
  text: TEXT,
  scoring: "accuracy",
  requiredAccuracy: 0.9,
  targetWpm: 20,
  timed: true,
  allowOptOut: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-keyboard-speed") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-keyboard-speed>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-keyboard-speed")).toBeDefined();
  });

  it("shows the passage and a box to type it into", async () => {
    const element = await mount();

    expect(element.textContent).toContain(TEXT);
    expect(element.querySelector("textarea")).not.toBeNull();
  });

  it("reports the typing through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    fireEvent.change(element.querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "the qu" },
    });
    await flush();

    const answer = listener.mock.calls[0][0].detail.answer;
    expect(answer.typed).toBe("the qu");
    // The finished text and one elapsed figure, and nothing else — no
    // key-by-key log leaves this component, because it never has one.
    expect(Object.keys(answer).sort()).toEqual(["elapsedMs", "optedOut", "typed"]);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders the passage as text and never as markup", async () => {
    const element = await mount({
      data: { ...data, text: "<script>window.ran = true</script>" },
    });

    // A passage is content, not markup: a `.bitflow` file can come from
    // anywhere.
    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { typed: TEXT, elapsedMs: 8000, optedOut: false },
    });

    expect(result.state).toBe("correct");
  });
});
