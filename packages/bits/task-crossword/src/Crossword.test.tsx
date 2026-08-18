import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Crossword } from "./Crossword";
import { outcomes } from "./evaluate";
import { cellKey, DataSchema, type Answer, type Data } from "./schema";

/**
 *   W O R D
 *       O
 *       W
 */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    words: [
      { id: "a", clue: "Letters together", answer: "WORD", row: 0, column: 0, orientation: "across" },
      { id: "b", clue: "A line of seats", answer: "ROW", row: 0, column: 2, orientation: "down" },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const setup = (letters: Record<string, string> = {}, props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Crossword
      data={data()}
      answer={{ letters }}
      locale="en"
      onChange={onChange}
      {...props}
    />,
  );
  const last = (): Answer => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

/** Feeds its own changes back, for tests that take more than one step. */
const Stateful = ({ over = {} as Partial<Data> }) => {
  const [answer, setAnswer] = useState<Answer>({ letters: {} });
  return (
    <Crossword
      data={data(over)}
      answer={answer}
      locale="en"
      onChange={setAnswer}
    />
  );
};

/** The square at a position, by the label a screen reader would read. */
const square = (row: number, column: number) =>
  screen.getByLabelText(new RegExp(`^Row ${row}, column ${column}\\b`));

describe("<Crossword>", () => {
  it("draws a square for every letter and a blank for the rest", () => {
    const { container } = setup();

    expect(container.querySelectorAll(".bitflow-crossword-cell")).toHaveLength(6);
    // A 4×3 grid with six letters in it.
    expect(container.querySelectorAll(".bitflow-crossword-blank")).toHaveLength(6);
  });

  it("says where a square is and what it answers", () => {
    setup();

    // Where the two words cross, both clues are read out.
    expect(square(1, 3).getAttribute("aria-label")).toBe(
      "Row 1, column 3. 1 Across, Letters together, letter 3 of 4. 2 Down, A line of seats, letter 1 of 3",
    );
  });

  it("writes a typed letter into the square", () => {
    const { last } = setup();

    fireEvent.change(square(1, 1), { target: { value: "w" } });

    expect(last().letters).toEqual({ [cellKey(0, 0)]: "W" });
  });

  it("moves along the word as the learner types", () => {
    render(<Stateful />);

    fireEvent.change(square(1, 1), { target: { value: "W" } });
    expect(document.activeElement).toBe(square(1, 2));

    fireEvent.change(square(1, 2), { target: { value: "O" } });
    expect(document.activeElement).toBe(square(1, 3));
  });

  it("clears a square with Backspace, and steps back when it is already empty", () => {
    render(<Stateful />);

    fireEvent.change(square(1, 1), { target: { value: "W" } });
    fireEvent.change(square(1, 2), { target: { value: "O" } });

    // On an empty square: back one and clear that.
    fireEvent.keyDown(square(1, 3), { key: "Backspace" });
    expect(document.activeElement).toBe(square(1, 2));
    expect((square(1, 2) as HTMLInputElement).value).toBe("");

    // On a filled one: clear it and stay put.
    fireEvent.keyDown(square(1, 1), { key: "Backspace" });
    expect((square(1, 1) as HTMLInputElement).value).toBe("");
  });

  it("moves between squares with the arrow keys", () => {
    render(<Stateful />);

    fireEvent.keyDown(square(1, 1), { key: "ArrowRight" });
    expect(document.activeElement).toBe(square(1, 2));
  });

  it("turns the corner rather than leaving the word", () => {
    const { container } = render(<Stateful />);
    const at = (row: number, column: number) =>
      square(row, column).closest(".bitflow-crossword-cell");

    // Down, from a square in an across word, means "now I am answering the
    // down clue" — not "move to the square below", which is often blank.
    fireEvent.focus(square(1, 3));
    fireEvent.keyDown(square(1, 3), { key: "ArrowDown" });

    expect(at(2, 3)?.classList.contains("bitflow-crossword-cell-word")).toBe(true);
    expect(at(1, 1)?.classList.contains("bitflow-crossword-cell-word")).toBe(false);
    expect(container.querySelectorAll(".bitflow-crossword-cell-word")).toHaveLength(3);
  });

  it("skips over the blanks when it moves", () => {
    render(<Stateful />);

    fireEvent.focus(square(3, 3));
    fireEvent.keyDown(square(3, 3), { key: "ArrowUp" });
    fireEvent.keyDown(square(3, 3), { key: "ArrowUp" });

    expect(document.activeElement).toBe(square(2, 3));
  });

  /** A real click: the press lands, the square takes focus, the click follows. */
  const click = (element: HTMLElement) => {
    fireEvent.pointerDown(element);
    fireEvent.focus(element);
    fireEvent.click(element);
  };

  it("selects a square without turning the corner", () => {
    const { container } = render(<Stateful />);

    // Clicking a square focuses it, and React has re-rendered by the time the
    // click arrives — so a first click used to select the square and switch
    // direction in one go.
    click(square(1, 3));

    expect(container.querySelectorAll(".bitflow-crossword-cell-word")).toHaveLength(4);
  });

  it("switches direction when the square under the cursor is clicked again", () => {
    const { container } = render(<Stateful />);

    click(square(1, 3));
    click(square(1, 3));

    expect(container.querySelectorAll(".bitflow-crossword-cell-word")).toHaveLength(3);
  });

  it("keeps one tab stop, so the grid can be left", () => {
    const { container } = setup();

    // A grid that swallows Tab is a trap for anyone using a keyboard.
    const stops = [...container.querySelectorAll(".bitflow-crossword-input")].filter(
      (input) => input.getAttribute("tabindex") !== "-1",
    );
    expect(stops).toHaveLength(1);
  });

  it("takes a whole answer typed beside its clue", () => {
    const { last } = setup();

    fireEvent.change(screen.getByLabelText(/^1 Across/), {
      target: { value: "word" },
    });

    expect(last().letters).toEqual({
      [cellKey(0, 0)]: "W",
      [cellKey(0, 1)]: "O",
      [cellKey(0, 2)]: "R",
      [cellKey(0, 3)]: "D",
    });
  });

  it("shows in the clue box what was typed into the grid", () => {
    setup({ [cellKey(0, 0)]: "W", [cellKey(0, 1)]: "O" });

    expect((screen.getByLabelText(/^1 Across/) as HTMLInputElement).value).toBe("WO");
  });

  it("clears the squares a shortened answer no longer covers", () => {
    const { last } = setup({
      [cellKey(0, 0)]: "W",
      [cellKey(0, 1)]: "O",
      [cellKey(0, 2)]: "R",
      [cellKey(0, 3)]: "D",
    });

    fireEvent.change(screen.getByLabelText(/^1 Across/), { target: { value: "WO" } });

    expect(last().letters).toEqual({ [cellKey(0, 0)]: "W", [cellKey(0, 1)]: "O" });
  });

  it("jumps to a clue when it is chosen from the list", () => {
    const { container } = render(<Stateful />);

    fireEvent.click(screen.getByRole("button", { name: /A line of seats/ }));

    expect(document.activeElement).toBe(square(1, 3));
    expect(container.querySelectorAll(".bitflow-crossword-cell-word")).toHaveLength(3);
  });

  it("marks each square and each clue once the answer is in", () => {
    const letters = {
      [cellKey(0, 0)]: "W",
      [cellKey(0, 1)]: "A",
      [cellKey(0, 2)]: "R",
      [cellKey(0, 3)]: "D",
      [cellKey(1, 2)]: "O",
      [cellKey(2, 2)]: "W",
    };
    const { container } = setup(letters, {
      outcomes: outcomes(data(), { letters }),
      readonly: true,
    });

    expect(container.querySelectorAll(".bitflow-crossword-cell-correct")).toHaveLength(5);
    expect(container.querySelectorAll(".bitflow-crossword-cell-wrong")).toHaveLength(1);
    // In words as well as in colour.
    expect(screen.getByText("not correct")).toBeDefined();
    expect(screen.getByText("correct")).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { onChange } = setup({}, { readonly: true });

    fireEvent.change(square(1, 1), { target: { value: "W" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("says so when there is nothing to solve", () => {
    render(
      <Crossword
        data={DataSchema.parse({ words: [], evaluation: { mode: "skip" } })}
        answer={{ letters: {} }}
        locale="en"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/no words yet/i)).toBeDefined();
  });
});
