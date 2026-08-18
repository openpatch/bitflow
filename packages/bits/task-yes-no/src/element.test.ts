import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  question: "Is 7 prime?",
  correctAnswer: true,
  evaluation: { ...defaultEvaluation(), mode: "auto", enableRetry: false, showFeedback: true },
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-yes-no") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-yes-no>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-yes-no")).toBeDefined();
  });

  it("renders the question and two options", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Is 7 prime?");
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });

  it("can be answered with the keyboard and evaluated in the browser", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    const yes = element.querySelectorAll("input")[0] as HTMLInputElement;
    yes.focus();
    expect(document.activeElement).toBe(yes);
    yes.click(); // what Space does on a focused radio
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
