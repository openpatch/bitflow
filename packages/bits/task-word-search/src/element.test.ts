import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Find the two words.",
  rows: 5,
  columns: 5,
  letters: ["CATXX", "OXXXX", "DXXXX", "EXXXX", "XXXXX"].join(""),
  words: [
    { id: "cat", text: "CAT", row: 0, column: 0, direction: "east" },
    { id: "code", text: "CODE", row: 0, column: 0, direction: "south" },
  ],
  directions: ["east", "south"],
  showWords: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-word-search") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-word-search>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-word-search")).toBeDefined();
  });

  it("draws the grid the letters describe", async () => {
    const element = await mount();

    expect(element.querySelectorAll(".bitflow-wordsearch-cell")).toHaveLength(25);
  });

  it("never shows where the words are before they are found", async () => {
    const element = await mount();

    // The positions are in the data the page was given; they must not be in
    // the page, where View Source would hand the puzzle over.
    expect(element.querySelectorAll(".bitflow-wordsearch-cell-found")).toHaveLength(0);
  });

  it("reports a find through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const grid = element.querySelector(".bitflow-wordsearch-grid") as HTMLElement;
    grid.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 250, height: 250 }) as DOMRect;
    fireEvent.pointerDown(grid, { button: 0, clientX: 25, clientY: 25 });
    fireEvent.pointerMove(window, { clientX: 125, clientY: 25 });
    fireEvent.pointerUp(window, { clientX: 125, clientY: 25 });
    await flush();

    expect(listener.mock.calls[0][0].detail.answer.found).toEqual([
      { row: 0, column: 0, endRow: 0, endColumn: 2 },
    ]);
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders a word as text and never as markup", async () => {
    const element = await mount({
      data: {
        ...data,
        words: [
          { ...data.words[0], text: "<script>window.ran = true</script>" },
          data.words[1],
        ],
      },
    });

    // A word is content, not markup: a `.bitflow` file can come from anywhere.
    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        found: [
          { row: 0, column: 0, endRow: 0, endColumn: 2 },
          { row: 0, column: 0, endRow: 3, endColumn: 0 },
        ],
      },
    });

    expect(result.state).toBe("correct");
  });
});
