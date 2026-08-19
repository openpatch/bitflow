import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

/** The form driving itself, since laying the grid out is a change like any other. */
const Editing = ({ initial }: { initial: Data }) => {
  const [data, setData] = useState(initial);
  return <Form data={data} locale="en" onChange={setData} errors={[]} />;
};

/**
 * Built rather than parsed, because half of what a form is for is the state
 * on the way to a valid one — a word with no answer typed into it yet.
 */
const withWords = (...answers: string[]): Data => ({
  ...DataSchema.parse({ words: [], evaluation: { mode: "skip" } }),
  words: answers.map((answer, index) => ({
    id: `w${index}`,
    clue: `Clue ${index + 1}`,
    answer,
    row: 0,
    column: 0,
    orientation: "across" as const,
  })),
});

const empty = () => withWords();

describe("<Form>", () => {
  it("adds a word without laying anything out yet", () => {
    render(<Editing initial={empty()} />);

    fireEvent.click(screen.getByRole("button", { name: /add a word/i }));

    expect(screen.getByText(/new word/i)).toBeDefined();
  });

  it("opens the word it just added, and leaves the others alone", () => {
    render(<Editing initial={withWords("CROSSWORD")} />);

    fireEvent.click(screen.getByRole("button", { name: /add a word/i }));

    const panels = [...document.querySelectorAll("fieldset details")];
    expect(panels.map((panel) => (panel as HTMLDetailsElement).open)).toEqual([
      false,
      true,
    ]);
  });

  const cells = (container: HTMLElement) =>
    container.querySelectorAll(
      ".bitflow-crossword-preview .bitflow-crossword-cell",
    ).length;

  it("lays the grid out as the answers are written", () => {
    const { container } = render(<Editing initial={withWords("CROSSWORD", "")} />);

    fireEvent.change(screen.getAllByLabelText(/^Answer$/)[1], {
      target: { value: "ROW" },
    });

    // Nine letters and three more, less the square they share: the author
    // sees the puzzle they are setting rather than a promise of one.
    expect(cells(container)).toBe(11);
  });

  it("does not move the grid about while a clue is being written", () => {
    const { container } = render(<Editing initial={withWords("CROSSWORD", "")} />);
    fireEvent.change(screen.getAllByLabelText(/^Answer$/)[1], {
      target: { value: "ROW" },
    });
    const before = container.querySelector(".bitflow-crossword-preview")?.innerHTML;

    fireEvent.change(screen.getAllByLabelText(/^Clue$/)[0], {
      target: { value: "A puzzle in a newspaper" },
    });

    expect(container.querySelector(".bitflow-crossword-preview")?.innerHTML).toBe(
      before,
    );
  });

  it("says which word it could not find room for", () => {
    render(<Editing initial={withWords("AAAA", "BBBB")} />);

    expect(screen.getByRole("alert").textContent).toMatch(/no room for BBBB/i);
  });

  it("says where each word ended up", () => {
    render(<Editing initial={withWords("CROSSWORD", "ROW")} />);

    // The author needs to know that "3 down" in their head is 3 down here.
    expect(screen.getAllByText(/\d+ (across|down)/).length).toBeGreaterThan(1);
  });
});
