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
  evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
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

const wordButtons = (element: HTMLElement) =>
  [...element.querySelectorAll("button")].filter((b) =>
    b.classList.contains("bitflow-highlight-token"),
  );

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-highlighting>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-highlighting")).toBeDefined();
  });

  it("makes every word a button, so there is a keyboard path", async () => {
    const element = await mount();
    expect(wordButtons(element).map((b) => b.textContent)).toEqual([
      "the",
      "cat",
      "sat",
    ]);
  });

  it("marks a word with the keyboard and evaluates it in the browser", async () => {
    const user = userEvent.setup();
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-evaluated", listener);

    const cat = wordButtons(element)[1];
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

    await user.click(wordButtons(element)[1]);
    await flush();

    expect(wordButtons(element)[1].getAttribute("aria-label")).toBe("cat — animal");
    expect(wordButtons(element)[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("unmarks a word marked in the active colour", async () => {
    const user = userEvent.setup();
    const element = await mount();

    await user.click(wordButtons(element)[1]);
    await flush();
    await user.click(wordButtons(element)[1]);
    await flush();

    expect(wordButtons(element)[1].getAttribute("aria-pressed")).toBe("false");
  });
});
