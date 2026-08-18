import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { outcomes } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";
import { WordGrid } from "./WordGrid";

/**
 *   C A T X X
 *   O X X X X
 *   D X X X X
 *   E X X X X
 *   X X X X X
 */
const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    rows: 5,
    columns: 5,
    letters: ["CATXX", "OXXXX", "DXXXX", "EXXXX", "XXXXX"].join(""),
    words: [
      { id: "cat", text: "CAT", row: 0, column: 0, direction: "east" },
      { id: "code", text: "CODE", row: 0, column: 0, direction: "south" },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const setup = (found: Answer["found"] = [], props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <WordGrid
      data={data()}
      answer={{ found }}
      locale="en"
      onChange={onChange}
      {...props}
    />,
  );
  const last = (): Answer => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  layOut(utils.container);
  return { onChange, last, ...utils };
};

/** Gives the grid a size, since jsdom reports every box as zero. */
const layOut = (container: HTMLElement) => {
  const grid = container.querySelector(".bitflow-wordsearch-grid");
  if (grid) {
    (grid as HTMLElement).getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 250, height: 250 }) as DOMRect;
  }
};

/** The middle of a square, in the coordinates the layout above implies. */
const point = (row: number, column: number) => ({
  clientX: column * 50 + 25,
  clientY: row * 50 + 25,
});

const grid = (container: HTMLElement) =>
  container.querySelector(".bitflow-wordsearch-grid") as HTMLElement;

const drag = (
  container: HTMLElement,
  from: [number, number],
  to: [number, number],
) => {
  fireEvent.pointerDown(grid(container), { button: 0, ...point(...from) });
  fireEvent.pointerMove(window, point(...to));
  fireEvent.pointerUp(window, point(...to));
};

const Stateful = ({ over = {} as Partial<Data> }) => {
  const [answer, setAnswer] = useState<Answer>({ found: [] });
  return (
    <WordGrid data={data(over)} answer={answer} locale="en" onChange={setAnswer} />
  );
};

describe("<WordGrid>", () => {
  it("draws every letter of the grid", () => {
    const { container } = setup();

    expect(container.querySelectorAll(".bitflow-wordsearch-cell")).toHaveLength(25);
    expect(screen.getByLabelText(/^A, row 1, column 2/)).toBeDefined();
  });

  it("finds a word drawn along it", () => {
    const { container, last } = setup();

    drag(container, [0, 0], [0, 2]);

    expect(last().found).toEqual([{ row: 0, column: 0, endRow: 0, endColumn: 2 }]);
  });

  it("finds a word drawn backwards", () => {
    const { container, last } = setup();

    drag(container, [0, 2], [0, 0]);

    expect(last().found).toHaveLength(1);
  });

  it("keeps nothing for a drag that found no word", () => {
    const { container, onChange } = setup();

    drag(container, [4, 0], [4, 4]);

    // A wrong drag costs nothing, so there is nothing to record.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("pulls a wandering drag onto the nearest straight line", () => {
    const { container, last } = setup();

    // Two across and one down plainly means the horizontal one; without
    // straightening it would mean nothing at all.
    fireEvent.pointerDown(grid(container), { button: 0, ...point(0, 0) });
    fireEvent.pointerMove(window, { clientX: 2 * 50 + 25, clientY: 0 * 50 + 40 });
    fireEvent.pointerUp(window, { clientX: 2 * 50 + 25, clientY: 0 * 50 + 40 });

    expect(last().found).toEqual([{ row: 0, column: 0, endRow: 0, endColumn: 2 }]);
  });

  it("shows the run while it is being drawn", () => {
    const { container } = setup();

    fireEvent.pointerDown(grid(container), { button: 0, ...point(0, 0) });
    fireEvent.pointerMove(window, point(0, 2));

    expect(container.querySelectorAll(".bitflow-wordsearch-cell-drawing")).toHaveLength(3);
  });

  it("strikes a found word through", () => {
    const { container } = setup([{ row: 0, column: 0, endRow: 0, endColumn: 2 }]);

    expect(container.querySelectorAll(".bitflow-wordsearch-cell-found")).toHaveLength(3);
    expect(
      container.querySelector(".bitflow-wordsearch-word-found")?.textContent,
    ).toMatch(/^CAT/);
  });

  it("says how many are left to find", () => {
    setup([{ row: 0, column: 0, endRow: 0, endColumn: 2 }]);

    expect(screen.getByText("Found 1 of 2")).toBeDefined();
  });

  it("does not record the same word twice", () => {
    const { container, onChange } = setup([
      { row: 0, column: 0, endRow: 0, endColumn: 2 },
    ]);

    drag(container, [0, 2], [0, 0]);

    expect(onChange).not.toHaveBeenCalled();
  });

  describe("with a keyboard", () => {
    const move = (container: HTMLElement, key: string, times = 1) => {
      for (let n = 0; n < times; n++) fireEvent.keyDown(grid(container), { key });
    };

    it("finds a word with two presses of Enter", () => {
      const { container, last } = setup();

      // The same two decisions as the drag — this square, then that one.
      fireEvent.keyDown(grid(container), { key: "Enter" });
      move(container, "ArrowRight", 2);
      fireEvent.keyDown(grid(container), { key: "Enter" });

      expect(last().found).toEqual([{ row: 0, column: 0, endRow: 0, endColumn: 2 }]);
    });

    it("shows the run as it is extended", () => {
      const { container } = setup();

      fireEvent.keyDown(grid(container), { key: "Enter" });
      move(container, "ArrowDown", 3);

      expect(container.querySelectorAll(".bitflow-wordsearch-cell-drawing")).toHaveLength(4);
    });

    it("abandons a run on Escape", () => {
      const { container, onChange } = setup();

      fireEvent.keyDown(grid(container), { key: "Enter" });
      move(container, "ArrowRight", 2);
      fireEvent.keyDown(grid(container), { key: "Escape" });
      fireEvent.keyDown(grid(container), { key: "Enter" });

      // The second Enter starts a new run rather than finishing the old one.
      expect(onChange).not.toHaveBeenCalled();
    });

    it("stays on the grid at its edge", () => {
      const { container } = setup();

      move(container, "ArrowUp", 3);
      move(container, "ArrowLeft", 3);

      expect(container.querySelector(".bitflow-wordsearch-cell-cursor")).toBe(
        container.querySelector(".bitflow-wordsearch-cell"),
      );
    });

    it("takes the focus when a square is pressed", () => {
      const { container } = setup();

      fireEvent.pointerDown(grid(container), { button: 0, ...point(0, 0) });

      // The press has to preventDefault, or the drag smears a text selection
      // across the grid — which also cancels the focus it would have given
      // the grid, leaving the arrow keys doing nothing after a click.
      expect(document.activeElement).toBe(grid(container));
    });

    it("is one tab stop, so the grid can be left", () => {
      const { container } = setup();

      // A grid of 25 tab stops is 25 presses to get past.
      expect(grid(container).getAttribute("tabindex")).toBe("0");
      expect(container.querySelectorAll("[tabindex='0']")).toHaveLength(1);
    });
  });

  it("says which words were missed once the answer is in", () => {
    const found = [{ row: 0, column: 0, endRow: 0, endColumn: 2 }];
    setup(found, {
      outcomes: outcomes(data(), { found }),
      readonly: true,
    });

    expect(screen.getByText("not found")).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { container, onChange } = setup([], { readonly: true });

    drag(container, [0, 0], [0, 2]);
    fireEvent.keyDown(grid(container), { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("tells the learner only how many there are when the list is hidden", () => {
    render(<Stateful over={{ showWords: false }} />);

    expect(screen.getByText(/2 words hidden/i)).toBeDefined();
    expect(screen.queryByText("CAT")).toBeNull();
  });
});
