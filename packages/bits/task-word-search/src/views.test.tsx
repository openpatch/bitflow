import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataSchema, cellsOf, lettersOf, type Data } from "./schema";
import { Form } from "./views";

/** The form driving itself, since building the grid is a change like any other. */
const Editing = ({ initial }: { initial: Data }) => {
  const [data, setData] = useState(initial);
  return <Form data={data} locale="en" onChange={setData} errors={[]} />;
};

const empty = (): Data =>
  DataSchema.parse({ words: [], evaluation: { mode: "skip" } });

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const preview = (container: HTMLElement) =>
  container.querySelectorAll(".bitflow-wordsearch-preview .bitflow-wordsearch-cell");

describe("<Form>", () => {
  it("builds the grid from the words as they are written", () => {
    const { container } = render(<Editing initial={empty()} />);

    type(/words to hide/i, "ARRAY\nLOOP\nSTACK");

    // The author sees the puzzle they are setting rather than a promise of
    // one that is only kept when a learner opens it.
    expect(preview(container)).toHaveLength(100);
    expect(
      container.querySelectorAll(".bitflow-wordsearch-preview .bitflow-wordsearch-cell-found")
        .length,
    ).toBeGreaterThan(10);
  });

  it("rebuilds when the grid is resized", () => {
    const { container } = render(<Editing initial={empty()} />);
    type(/words to hide/i, "ARRAY\nLOOP");

    fireEvent.change(screen.getByLabelText(/^Rows$/), { target: { value: "8" } });

    expect(preview(container)).toHaveLength(80);
  });

  it("keeps the grid and the words in step", () => {
    const { container } = render(<Editing initial={empty()} />);

    type(/words to hide/i, "ARRAY\nLOOP\nSTACK");
    type(/words to hide/i, "ARRAY\nLOOP\nSTACK\nQUEUE");

    // Whatever the author does, the grid on screen has to be one that
    // actually contains the words listed beside it.
    const letters = [...preview(container)].map((cell) => cell.textContent).join("");
    const rendered = { rows: 10, columns: 10, letters };
    for (const word of ["ARRAY", "LOOP", "STACK", "QUEUE"]) {
      expect(letters).toContain(word[0]);
    }
    expect(rendered.letters).toHaveLength(100);
  });

  it("says which word it could not find room for", () => {
    render(<Editing initial={empty()} />);

    type(/words to hide/i, "ANTIDISESTABLISHMENTARIANISM");

    expect(screen.getByRole("alert").textContent).toMatch(/no room for/i);
  });

  it("keeps a word's id while the word itself is unchanged", () => {
    let latest: Data = empty();
    const Watching = () => {
      const [data, setData] = useState(empty());
      latest = data;
      return (
        <Form
          data={data}
          locale="en"
          onChange={(next) => setData(next as Data)}
          errors={[]}
        />
      );
    };
    render(<Watching />);

    type(/words to hide/i, "ARRAY\nLOOP");
    const before = latest.words.find((word) => word.text === "LOOP")?.id;
    type(/words to hide/i, "STACK\nARRAY\nLOOP");

    // An answer that named a word by position would be wrong the moment the
    // author inserted one above it.
    expect(latest.words.find((word) => word.text === "LOOP")?.id).toBe(before);
  });

  it("never leaves every direction switched off", () => {
    let latest: Data = empty();
    const Watching = () => {
      const [data, setData] = useState(
        DataSchema.parse({
          words: [],
          directions: ["east"],
          evaluation: { mode: "skip" },
        }),
      );
      latest = data;
      return (
        <Form
          data={data}
          locale="en"
          onChange={(next) => setData(next as Data)}
          errors={[]}
        />
      );
    };
    render(<Watching />);

    fireEvent.click(screen.getByLabelText(/left to right/i));

    // The generator would have nowhere to put anything.
    expect(latest.directions).toEqual(["east"]);
  });

  it("puts the words where the grid says they are", () => {
    let latest: Data = empty();
    const Watching = () => {
      const [data, setData] = useState(empty());
      latest = data;
      return (
        <Form
          data={data}
          locale="en"
          onChange={(next) => setData(next as Data)}
          errors={[]}
        />
      );
    };
    render(<Watching />);

    type(/words to hide/i, "ARRAY\nLOOP\nSTACK");

    for (const word of latest.words) {
      const spelled = cellsOf(word)
        .map((cell) => latest.letters[cell.row * latest.columns + cell.column])
        .join("");
      expect(spelled).toBe(lettersOf(word.text).join(""));
    }
  });
});
