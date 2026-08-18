import { defaultEvaluation } from "@bitflow/core";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Complete the sentence.",
  text: "The capital of France is [[1]].",
  blanks: { "1": ["Paris"] },
  caseSensitive: false,
  trim: true,
  partialCredit: true,
  evaluation: { ...defaultEvaluation(), mode: "auto", enableRetry: false, showFeedback: true },
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement(
    "bitflow-task-fill-in-the-blank",
  ) as HTMLElement & Record<string, unknown>;
  Object.assign(element, { data, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-fill-in-the-blank>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-fill-in-the-blank")).toBeDefined();
  });

  it("renders the text with an input where the blank is", async () => {
    const element = await mount();
    expect(element.textContent).toContain("The capital of France is");
    const inputs = element.querySelectorAll("input");
    expect(inputs).toHaveLength(1);
    // Numbered, because the surrounding sentence is not a usable label.
    expect(inputs[0].getAttribute("aria-label")).toBe("Blank 1");
  });

  it("can be filled in with the keyboard and evaluated in the browser", async () => {
    const user = userEvent.setup();
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    const input = element.querySelector("input") as HTMLInputElement;
    await user.click(input);
    expect(document.activeElement).toBe(input);
    await user.keyboard("Paris");
    await flush();

    const check = [...element.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Check"),
    );
    check?.click();
    await flush();

    expect(listener.mock.calls[0][0].detail.result.state).toBe("correct");
    document.removeEventListener("bitflow-evaluated", listener);
  });
});
