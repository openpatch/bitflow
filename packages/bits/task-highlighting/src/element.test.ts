import { defaultEvaluation } from "@bitflow/core";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const text = "the cat sat";
const data = {
  instruction: "Mark the animal.",
  text,
  colors: { yellow: { enabled: true, label: "animal" } },
  // "cat" is characters 4-6.
  reference: [...text].map((_, i) => (i >= 4 && i < 7 ? "yellow" : null)),
  cutoffs: { yellow: 0.6 },
  evaluation: { ...defaultEvaluation(), mode: "auto", enableRetry: false, showFeedback: true },
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement(
    "bitflow-task-highlighting",
  ) as HTMLElement & Record<string, unknown>;
  Object.assign(element, { data, ...props });
  document.body.append(element);
  await flush();
  return element;
};

/**
 * The markable words. They are spans with `role="button"`, not `<button>`
 * elements: a button cannot be selected as text in every browser, and dragging
 * across the text is the gesture this task exists for.
 */
const words = (element: HTMLElement) =>
  [...element.querySelectorAll<HTMLElement>('[role="button"].bitflow-highlight-token')];

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-highlighting>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-highlighting")).toBeDefined();
  });

  it("gives every word a tab stop, so there is a keyboard path", async () => {
    const element = await mount();
    expect(words(element).map((w) => w.textContent)).toEqual([
      "the",
      "cat",
      "sat",
    ]);
    expect(words(element).every((w) => w.tabIndex === 0)).toBe(true);
  });

  it("leaves the text selectable, which is how highlighting is done", async () => {
    const element = await mount();
    // Every run carries the character index it starts at, which is what turns
    // a DOM selection back into a character range.
    const runs = [...element.querySelectorAll<HTMLElement>("[data-start]")];
    expect(runs.length).toBeGreaterThan(1);
    expect(runs.map((r) => r.dataset.start)).toContain("4"); // "cat"
    // Nothing here is a <button>, which browsers refuse to let you select.
    expect(element.querySelectorAll(".bitflow-highlight-token button")).toHaveLength(0);
  });

  it("marks the range the learner dragged across", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    // "cat sat" — a drag from inside one run to inside a later one.
    const cat = element.querySelector<HTMLElement>('[data-start="4"]')!;
    const sat = element.querySelector<HTMLElement>('[data-start="8"]')!;
    const range = document.createRange();
    range.setStart(cat.firstChild!, 0);
    range.setEnd(sat.firstChild!, 3);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    element
      .querySelector(".bitflow-highlight-text")!
      .dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await flush();

    const highlights = listener.mock.calls[0][0].detail.answer.highlights;
    // "the cat sat": characters 4 to 10 inclusive are "cat sat".
    expect(highlights).toHaveLength(text.length);
    expect(highlights.slice(4).every((c: unknown) => c === "yellow")).toBe(true);
    // The word before the selection is untouched.
    expect(highlights.slice(0, 4).every((c: unknown) => c === null)).toBe(true);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("marks a word with the keyboard and evaluates it in the browser", async () => {
    const user = userEvent.setup();
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    const cat = words(element)[1];
    cat.focus();
    expect(document.activeElement).toBe(cat);
    await user.keyboard("{Enter}");
    await flush();

    const check = [...element.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Check"),
    );
    check?.click();
    await flush();

    const result = listener.mock.calls[0][0].detail.result;
    expect(result.state).toBe("correct");
    expect(result.detail.agreement.yellow).toBe(1);
    document.removeEventListener("bitflow-evaluated", listener);
  });

  it("names the colour's meaning in the accessible label once marked", async () => {
    const user = userEvent.setup();
    const element = await mount();

    await user.click(words(element)[1]);
    await flush();

    expect(words(element)[1].getAttribute("aria-label")).toBe("cat — animal");
    expect(words(element)[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("unmarks a word marked in the active colour", async () => {
    const user = userEvent.setup();
    const element = await mount();

    await user.click(words(element)[1]);
    await flush();
    await user.click(words(element)[1]);
    await flush();

    expect(words(element)[1].getAttribute("aria-pressed")).toBe("false");
  });
});
