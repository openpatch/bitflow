import { defaultEvaluation } from "@bitflow/core";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Capital of France?",
  matchMode: "exact",
  expected: ["Paris"],
  pattern: "",
  caseSensitive: false,
  trim: true,
  multiline: false,
  evaluation: { ...defaultEvaluation(), mode: "auto", enableRetry: false, showFeedback: true },
  patternFeedback: [],
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-input") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-input>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-input")).toBeDefined();
  });

  it("labels its input", async () => {
    const element = await mount();
    const input = element.querySelector("input") as HTMLInputElement;
    const label = element.querySelector(`label[for="${input.id}"]`);
    expect(label?.textContent).toBe("Your answer");
  });

  it("accepts a typed answer and evaluates it in the browser", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    const user = userEvent.setup();
    const input = element.querySelector("input") as HTMLInputElement;

    // Typed rather than assigned: React tracks the last value it rendered and
    // ignores a direct `.value` write, so only real key events reach it.
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

  it("renders a textarea when the author asked for one", async () => {
    const element = await mount({ data: { ...data, multiline: true } });
    expect(element.querySelector("textarea")).toBeDefined();
  });
});
