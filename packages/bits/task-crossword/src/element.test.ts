import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import { cellKey } from "./schema";

const data = {
  instruction: "Two words, one crossing the other.",
  words: [
    { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
    { id: "b", clue: "A line of seats", answer: "ROW", row: 0, column: 2, orientation: "down" },
  ],
  scoring: "words",
  penaliseWrong: false,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-crossword") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-crossword>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-crossword")).toBeDefined();
  });

  it("draws the grid the words describe", async () => {
    const element = await mount();

    expect(element.querySelectorAll(".bitflow-crossword-cell")).toHaveLength(6);
  });

  it("never shows the answers before they are asked for", async () => {
    const element = await mount();

    // The solution is in the data the page was given; it must not be in the
    // page, where View Source would hand the crossword over.
    expect(element.textContent).not.toContain("WORD");
    expect(
      [...element.querySelectorAll("input")].some((input) => input.value !== ""),
    ).toBe(false);
  });

  it("reports a letter through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const first = element.querySelector(".bitflow-crossword-input") as HTMLInputElement;
    fireEvent.change(first, { target: { value: "W" } });
    await flush();

    expect(listener.mock.calls[0][0].detail.answer.letters).toEqual({
      [cellKey(0, 0)]: "W",
    });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders a clue as text and never as markup", async () => {
    const element = await mount({
      data: {
        ...data,
        words: [
          { ...data.words[0], clue: "<script>window.ran = true</script>" },
          data.words[1],
        ],
      },
    });

    // A clue is content, not markup: a `.bitflow` file can come from anywhere.
    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
    expect(element.textContent).toContain("<script>");
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        letters: {
          [cellKey(0, 0)]: "W",
          [cellKey(0, 1)]: "O",
          [cellKey(0, 2)]: "R",
          [cellKey(0, 3)]: "D",
          [cellKey(1, 2)]: "O",
          [cellKey(2, 2)]: "W",
        },
      },
    });

    expect(result.state).toBe("correct");
  });
});
