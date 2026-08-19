import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { cellStates } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Trace the loop.",
    language: "JavaScript",
    code: "let total = 0;\nfor (const v of [1, 2, 3]) total += v;\nprint(total);",
    columns: [
      { id: "total", name: "total", kind: "value" },
      { id: "next", name: "next line", kind: "line" },
    ],
    checkpoints: [
      { id: "before", label: "before the loop", line: 1, expected: { total: "0", next: "2" } },
      { id: "after", label: "after the loop", line: 3, expected: { total: "6", next: "3" } },
    ],
    ...over,
  });

/** The task driving itself, since a cell only changes when the answer does. */
const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task
      data={initial}
      answer={answer}
      locale="en"
      onAnswerChange={setAnswer}
    />
  );
};

describe("<Task>", () => {
  it("shows the program line by line, numbered", () => {
    const { container } = render(<Answering initial={data()} />);

    const lines = container.querySelectorAll(".bitflow-trace-line");
    expect(lines).toHaveLength(3);
    expect(lines[0].textContent).toContain("let total = 0;");
    expect(lines[0].querySelector(".bitflow-trace-number")?.textContent).toBe("1");
  });

  it("shows the code as text and never as markup", () => {
    const { container } = render(
      <Answering
        initial={data({ code: "<script>window.ran = true</script>\nprint(1);\nprint(2);" })}
      />,
    );

    // A `.bitflow` file can come from anywhere; code is content, not markup.
    expect(container.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
    expect(container.textContent).toContain("<script>window.ran = true</script>");
  });

  it("marks the lines a checkpoint watches", () => {
    const { container } = render(<Answering initial={data()} />);

    const marks = [...container.querySelectorAll(".bitflow-trace-mark")].map(
      (mark) => mark.textContent,
    );
    expect(marks).toEqual(["before the loop", "after the loop"]);
  });

  it("keeps what is typed in a cell", () => {
    render(<Answering initial={data()} />);

    fireEvent.change(screen.getByLabelText("total, before the loop"), {
      target: { value: "0" },
    });

    expect(screen.getByLabelText<HTMLInputElement>("total, before the loop").value).toBe("0");
  });

  it("reports each cell through the answer", () => {
    const onAnswerChange = vi.fn();
    render(
      <Task data={data()} locale="en" onAnswerChange={onAnswerChange} />,
    );

    fireEvent.change(screen.getByLabelText("total, after the loop"), {
      target: { value: "6" },
    });

    expect(onAnswerChange).toHaveBeenCalledWith({
      cells: { after: { total: "6" } },
    });
  });

  it("offers the program's lines rather than a number to type", () => {
    render(<Answering initial={data()} />);

    const select = screen.getByLabelText<HTMLSelectElement>("next line, before the loop");
    expect([...select.options].map((option) => option.textContent)).toEqual([
      "Choose a line",
      "Line 1: let total = 0;",
      "Line 2: for (const v of [1, 2, 3]) total += v;",
      "Line 3: print(total);",
    ]);
  });

  it("numbers the lines whatever the setting when a column names one", () => {
    // The answer names a line, so hiding the numbers would make it a guess.
    const { container } = render(
      <Answering initial={data({ showLineNumbers: false })} />,
    );

    expect(container.querySelector(".bitflow-trace-number")).not.toBeNull();
  });

  it("hides the numbers when nothing needs them", () => {
    const { container } = render(
      <Answering
        initial={data({
          showLineNumbers: false,
          columns: [{ id: "total", name: "total", kind: "value" }],
          checkpoints: [{ id: "after", label: "after", expected: { total: "6" } }],
        })}
      />,
    );

    expect(container.querySelector(".bitflow-trace-number")).toBeNull();
  });

  it("shows which cells were right", () => {
    const filled = data();
    const answer: Answer = {
      cells: { before: { total: "0", next: "2" }, after: { total: "7", next: "3" } },
    };
    const { container } = render(
      <Task
        data={filled}
        answer={answer}
        result={{ state: "wrong", detail: { cells: cellStates(filled, answer) } }}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(container.querySelectorAll(".bitflow-trace-cell-correct")).toHaveLength(3);
    expect(container.querySelectorAll(".bitflow-trace-cell-wrong")).toHaveLength(1);
    // Not by colour alone.
    expect(container.textContent).toContain("wrong");
  });

  it("accepts no input once it is answered", () => {
    render(
      <Task
        data={data()}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(screen.getByLabelText<HTMLInputElement>("total, before the loop").disabled).toBe(
      true,
    );
  });
});

/** The form driving itself, since adding a column changes what else is shown. */
const Editing = ({ initial }: { initial: Data }) => {
  const [state, setState] = useState(initial);
  return <Form data={state} locale="en" onChange={setState} errors={[]} />;
};

const empty = (): Data => DataSchema.parse({ evaluation: { mode: "skip" } });

describe("<Form>", () => {
  it("puts the answer key in the learner's own table", () => {
    render(<Editing initial={empty()} />);

    fireEvent.click(screen.getByRole("button", { name: /add a column/i }));
    fireEvent.change(screen.getByLabelText(/heading of column 1/i), {
      target: { value: "total" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add a checkpoint/i }));

    // One cell per column per checkpoint, labelled the way the learner's is —
    // it is the same table, filled in from the other side.
    expect(screen.getByLabelText("total, Step 1")).toBeTruthy();
  });

  it("says what to do before there is a table to fill in", () => {
    render(<Editing initial={empty()} />);

    expect(screen.getByText(/the table to fill in appears here/i)).toBeTruthy();
  });

  it("writes a value typed in the table onto its checkpoint", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(screen.getByLabelText("total, before the loop"), {
      target: { value: "42" },
    });

    const next = onChange.mock.calls[0][0] as Data;
    expect(next.checkpoints[0].expected).toEqual({ total: "42", next: "2" });
    // The other row is untouched.
    expect(next.checkpoints[1].expected).toEqual({ total: "6", next: "3" });
  });

  it("shows the values already written, so the key can be read down a column", () => {
    render(<Editing initial={data()} />);

    expect(
      screen.getByLabelText<HTMLInputElement>("total, before the loop").value,
    ).toBe("0");
    expect(
      screen.getByLabelText<HTMLInputElement>("total, after the loop").value,
    ).toBe("6");
  });

  it("takes a column's expected values away with it", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /remove total/i }));

    const next = onChange.mock.calls[0][0] as Data;
    expect(next.columns.map((column) => column.id)).toEqual(["next"]);
    // Left behind they would be invisible in the form and would come back the
    // moment a new column was given the same id.
    expect(next.checkpoints[0].expected).toEqual({ next: "2" });
  });

  it("offers the program's lines for a next-line answer", () => {
    render(<Editing initial={data()} />);

    const select = screen.getByLabelText<HTMLSelectElement>(
      "next line, before the loop",
    );
    expect([...select.options].map((option) => option.value)).toEqual([
      "",
      "1",
      "2",
      "3",
    ]);
  });

  it("moves a checkpoint", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.click(
      screen.getByRole("button", { name: /move before the loop down/i }),
    );

    expect(
      (onChange.mock.calls[0][0] as Data).checkpoints.map((c) => c.id),
    ).toEqual(["after", "before"]);
  });

  it("moves a column, and the table's headings move with it", () => {
    render(<Editing initial={data()} />);

    fireEvent.click(screen.getByRole("button", { name: /move next line left/i }));

    const headings = [
      ...document.querySelectorAll(".bitflow-trace-table thead th"),
    ].map((th) => th.textContent);
    expect(headings[1]).toContain("next line");
    expect(headings[2]).toContain("total");
  });

  it("reports a line that is not in the program under the table", () => {
    render(
      <Form
        data={data()}
        locale="en"
        onChange={() => {}}
        errors={[
          {
            path: "checkpoints.0.expected.next",
            message: "“9” is not one of the program's 3 lines.",
          },
        ]}
      />,
    );

    // Reported against a cell, which has no label of its own to sit under.
    expect(screen.getByRole("alert").textContent).toContain("is not one of");
  });
});
