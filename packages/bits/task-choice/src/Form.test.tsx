import { render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Form } from "./Form";
import { DataSchema, type Data } from "./schema";

const withChoices = (variant: Data["variant"], ...correct: boolean[]): Data => ({
  ...DataSchema.parse({
    instruction: "Pick one",
    variant,
    choices: [
      { id: "a", markdown: "A", correct: false },
      { id: "b", markdown: "B", correct: false },
    ],
    evaluation: { mode: "skip" },
  }),
  variant,
  choices: correct.map((isCorrect, index) => ({
    id: `c${index}`,
    markdown: String.fromCharCode(65 + index),
    correct: isCorrect,
  })),
});

const Editing = ({ initial }: { initial: Data }) => {
  const [data, setData] = useState(initial);
  return <Form data={data} locale="en" onChange={setData} errors={[]} />;
};

const marks = (): HTMLInputElement[] => [
  ...document.querySelectorAll<HTMLInputElement>(
    ".bitflow-choice-editor-correct input[type=radio]",
  ),
];

describe("<Form>", () => {
  it("moves the correct mark when a single-choice task is re-marked", async () => {
    const user = userEvent.setup();
    render(<Editing initial={withChoices("single", true, false)} />);

    const [first, second] = marks();
    await user.click(second);

    expect(first.checked).toBe(false);
    expect(second.checked).toBe(true);
  });

  /**
   * Radios group by name, and the grouping is per document, not per form. Two
   * choice steps edited on one page — a flow with two of them, or a gallery —
   * shared one group while the name was a constant, so marking the answer in
   * one silently cleared the answer in the other.
   */
  it("keeps two editors on one page from sharing a group", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Editing initial={withChoices("single", true, false)} />
        <Editing initial={withChoices("single", true, false)} />
      </>,
    );

    const inputs = marks();
    expect(inputs).toHaveLength(4);

    // Re-mark the second task's second choice.
    await user.click(inputs[3]);

    expect(inputs[3].checked).toBe(true);
    // The first task is untouched.
    expect(inputs[0].checked).toBe(true);
  });

  it("reorders the choices", async () => {
    const user = userEvent.setup();
    render(<Editing initial={withChoices("single", true, false, false)} />);

    await user.click(
      screen.getAllByRole("button", { name: "Move this choice down" })[0],
    );

    const texts = [
      ...document.querySelectorAll<HTMLInputElement>(
        ".bitflow-choice-editor > .bitflow-input",
      ),
    ].map((input) => input.value);
    expect(texts).toEqual(["B", "A", "C"]);
  });

  it("carries the correct mark with the choice it belongs to", async () => {
    const user = userEvent.setup();
    render(<Editing initial={withChoices("single", true, false)} />);

    await user.click(
      screen.getAllByRole("button", { name: "Move this choice down" })[0],
    );

    // A was the answer and still is, wherever it has moved to.
    expect(marks()[1].checked).toBe(true);
    expect(marks()[0].checked).toBe(false);
  });
});
