import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Put the program back together.",
    language: "Python",
    lines: [
      { id: "def", text: "def total(values):", indent: 0 },
      { id: "sum", text: "sum = 0", indent: 1 },
      { id: "for", text: "for value in values:", indent: 1 },
      { id: "add", text: "sum += value", indent: 2 },
      { id: "ret", text: "return sum", indent: 1 },
      { id: "stray", text: "sum = value", indent: 0, distractor: true },
    ],
    evaluation: { mode: "skip" },
    ...over,
  });

/** The form driving itself, since the boxes hold what was typed into them. */
const Editing = ({ initial }: { initial: Data }) => {
  const [state, setState] = useState(initial);
  return <Form data={state} locale="en" onChange={setState} errors={[]} />;
};

const program = () => screen.getByLabelText<HTMLTextAreaElement>(/the program/i);
const strays = () =>
  screen.getByLabelText<HTMLTextAreaElement>(/lines that do not belong/i);

describe("<Form>", () => {
  it("shows the program as a program, nesting and all", () => {
    render(<Editing initial={data()} />);

    expect(program().value).toBe(
      [
        "def total(values):",
        "    sum = 0",
        "    for value in values:",
        "        sum += value",
        "    return sum",
      ].join("\n"),
    );
  });

  it("keeps the lines that do not belong in their own box", () => {
    render(<Editing initial={data()} />);

    expect(strays().value).toBe("sum = value");
  });

  it("reads nesting off whatever the code is written in", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(program(), {
      target: { value: "if x:\n  a()\n    b()" },
    });

    const next = onChange.mock.calls[0][0] as Data;
    expect(next.lines.filter((l) => !l.distractor).map((l) => l.indent)).toEqual([
      0, 1, 2,
    ]);
  });

  /**
   * The reason the boxes hold their own text: `asText` writes a step back out
   * as four spaces, so a controlled textarea rebuilt from the document would
   * snap the author's second space away under the caret.
   */
  it("leaves what was typed exactly as typed", () => {
    render(<Editing initial={data({ lines: [] })} />);

    fireEvent.change(program(), { target: { value: "if x:\n  a()" } });

    expect(program().value).toBe("if x:\n  a()");
  });

  it("keeps a line's id while its code is unchanged", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    // A line inserted at the top must not renumber the answers below it.
    fireEvent.change(program(), {
      target: { value: "x = 1\ndef total(values):\n    sum = 0" },
    });

    const next = onChange.mock.calls[0][0] as Data;
    expect(next.lines.map((l) => l.id).slice(1, 3)).toEqual(["def", "sum"]);
  });

  it("says what level each line came out at", () => {
    render(<Editing initial={data()} />);

    const levels = [
      ...document.querySelectorAll(".bitflow-parsons-read-level"),
    ].map((span) => span.textContent);
    expect(levels).toEqual([
      "Level 0",
      "Level 1",
      "Level 1",
      "Level 2",
      "Level 1",
    ]);
  });

  it("reads back only the program, not the strays", () => {
    render(<Editing initial={data()} />);

    const lines = [
      ...document.querySelectorAll(".bitflow-parsons-read-line code"),
    ].map((code) => code.textContent);
    expect(lines).not.toContain("sum = value");
  });

  it("re-seeds the boxes when the document changes underneath", () => {
    const { rerender } = render(
      <Form data={data()} locale="en" onChange={() => {}} errors={[]} />,
    );

    // What an undo, or selecting a different step, looks like from here.
    rerender(
      <Form
        data={data({ lines: [{ id: "one", text: "print(1)", indent: 0 }] })}
        locale="en"
        onChange={() => {}}
        errors={[]}
      />,
    );

    expect(program().value).toBe("print(1)");
  });
});
