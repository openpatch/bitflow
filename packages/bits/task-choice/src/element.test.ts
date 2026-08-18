import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

/**
 * The decision-11 claim, tested directly: importing this package is enough to
 * drop `<bitflow-task-choice>` on a bare page. No flow, no editor, no registry
 * bootstrapping by the host.
 */

const data = {
  instruction: "Which are prime?",
  variant: "multiple",
  choices: [
    { id: "a", markdown: "2", correct: true },
    { id: "b", markdown: "3", correct: true },
    { id: "c", markdown: "4", correct: false },
  ],
  shuffle: false,
  partialCredit: false,
  evaluation: { ...defaultEvaluation(), mode: "auto", enableRetry: false, showFeedback: true },
  patternFeedback: [],
};

/**
 * r2wc mounts asynchronously and evaluation is a promise, so let the task queue
 * drain a few times rather than guessing at a single tick.
 */
const flush = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const mount = async (properties: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-choice") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, ...properties });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("<bitflow-task-choice>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-choice")).toBeDefined();
  });

  it("survives being defined twice", async () => {
    // A page may load the editor bundle and a standalone bit bundle, and both
    // run this module. Redefining a tag name throws, so the guard matters.
    await expect(import("./index")).resolves.toBeDefined();
  });

  it("renders the task from its data property", async () => {
    const element = await mount();
    expect(element.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
    expect(element.textContent).toContain("Which are prime?");
  });

  it("emits bitflow-answerchange when the learner picks a choice", async () => {
    const element = await mount();
    const listener = vi.fn();
    // Listening on `document` proves the event really bubbles out of the
    // element, which is what a host page relies on.
    document.addEventListener("bitflow-answerchange", listener);

    const checkbox = element.querySelectorAll("input")[0] as HTMLInputElement;
    checkbox.click();
    await flush();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual({ answer: { selected: ["a"] } });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("does not emit an answer change when the host assigns the answer", async () => {
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    await mount({ answer: { selected: ["a"] } });

    expect(listener).not.toHaveBeenCalled();
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("evaluates on its own and emits bitflow-evaluated", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    // Flushed between clicks: a controlled component reads the selection from
    // the props it was last rendered with, exactly as it would between two real
    // user clicks.
    (element.querySelectorAll("input")[0] as HTMLInputElement).click();
    await flush();
    (element.querySelectorAll("input")[1] as HTMLInputElement).click();
    await flush();

    const check = [...element.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Check"),
    );
    check?.click();
    await flush();

    expect(listener).toHaveBeenCalledOnce();
    const { answer, result } = listener.mock.calls[0][0].detail;
    expect(answer).toEqual({ selected: ["a", "b"] });
    expect(result.state).toBe("correct");
    document.removeEventListener("bitflow-evaluated", listener);
  });

  it("shows the outcome after checking", async () => {
    const element = await mount({ answer: { selected: ["c"] } });
    const check = [...element.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Check"),
    );
    check?.click();
    await flush();

    expect(element.textContent).toContain("Not correct");
  });

  it("hides its own controls when a host provides them", async () => {
    const element = await mount({ controls: false });
    expect(element.querySelectorAll("button")).toHaveLength(0);
  });

  it("explains itself rather than rendering nothing for invalid data", async () => {
    const element = await mount({ data: { instruction: "x" } });
    expect(element.textContent).toContain("not configured correctly");
  });

  it("reads its locale from the attribute", async () => {
    const element = await mount({ locale: "de" });
    expect(element.textContent).toContain("Prüfen");
  });
});
