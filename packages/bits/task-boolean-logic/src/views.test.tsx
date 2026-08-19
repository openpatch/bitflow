import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { evaluate, solutionOf } from "./evaluate";
import { parse } from "./expression";
import { DataSchema, rowsOf, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const expression = (source: string) => {
  const result = parse(source);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Complete the output column.",
    variables: ["A", "B"],
    columns: [{ id: "out", label: "", expression: expression("A ∧ ¬B"), given: false }],
    ...over,
  });

const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task data={initial} answer={answer} locale="en" onAnswerChange={setAnswer} />
  );
};

describe("<Task>", () => {
  it("draws a row per combination, with the inputs given", () => {
    const { container } = render(<Answering initial={data()} />);

    expect(container.querySelectorAll("tbody tr")).toHaveLength(4);
    const first = container.querySelectorAll("tbody tr")[0];
    expect(first.textContent).toContain("false");
  });

  it("heads a column with the expression when the author named nothing", () => {
    const { container } = render(<Answering initial={data()} />);

    expect(container.querySelector("thead")?.textContent).toContain("A ∧ ¬B");
  });

  it("uses the author's heading when there is one", () => {
    const { container } = render(
      <Answering
        initial={data({
          columns: [
            { id: "out", label: "Output", expression: expression("A ∧ ¬B"), given: false },
          ],
        })}
      />,
    );

    expect(container.querySelector("thead")?.textContent).toContain("Output");
  });

  /**
   * A cell has three states and a checkbox has two. A learner who has not
   * reached a row must not look like one who said false.
   */
  it("lets a cell go back to having no answer", () => {
    render(<Answering initial={data()} />);
    const cell = screen.getByLabelText<HTMLSelectElement>(
      "A ∧ ¬B, when A is true and B is false",
    );

    fireEvent.change(cell, { target: { value: "1" } });
    expect(cell.value).toBe("1");

    fireEvent.change(cell, { target: { value: "" } });
    expect(cell.value).toBe("");
  });

  it("names each cell by its column and its row", () => {
    render(<Answering initial={data()} />);

    expect(
      screen.getByLabelText("A ∧ ¬B, when A is false and B is true"),
    ).toBeTruthy();
  });

  it("shows a worked column filled in, and refuses to take an answer for it", () => {
    render(
      <Answering
        initial={data({
          columns: [
            { id: "step", label: "¬B", expression: expression("¬B"), given: true },
            { id: "out", label: "", expression: expression("A ∧ ¬B"), given: false },
          ],
        })}
      />,
    );

    const step = screen.getByLabelText<HTMLSelectElement>(
      "¬B, when A is false and B is false",
    );
    expect(step.value).toBe("1");
    expect(step.disabled).toBe(true);
  });

  it("marks each cell once it is answered", () => {
    const solution = solutionOf(data());
    const answer: Answer = {
      cells: Object.fromEntries(
        rowsOf(data()).map((row) => [row.id, { out: solution[row.id].out }]),
      ),
    };
    const { container } = render(
      <Task
        data={data()}
        answer={answer}
        result={evaluate({ data: data(), answer })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(
      container.querySelectorAll(".bitflow-truth-cell-correct"),
    ).toHaveLength(4);
  });

  it("accepts no input once it is answered", () => {
    render(<Task data={data()} readonly locale="en" onAnswerChange={() => {}} />);

    expect(
      screen.getByLabelText<HTMLSelectElement>(
        "A ∧ ¬B, when A is true and B is false",
      ).disabled,
    ).toBe(true);
  });
});

const Editing = ({ initial }: { initial: Data }) => {
  const [state, setState] = useState(initial);
  return <Form data={state} locale="en" onChange={setState} errors={[]} />;
};

const expressionBox = () =>
  screen.getByLabelText<HTMLInputElement>("Expression for column 1");

describe("<Form>", () => {
  it("takes an expression typed the way it is written on a board", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(expressionBox(), { target: { value: "A OR NOT B" } });

    expect((onChange.mock.calls[0][0] as Data).columns[0].expression).toEqual(
      expression("A ∨ ¬B"),
    );
  });

  /** Precedence is where these go wrong, and the brackets are the only tell. */
  it("says how the expression was understood", () => {
    render(<Editing initial={data()} />);

    fireEvent.change(expressionBox(), { target: { value: "A OR B AND C" } });

    // In the "Read as" line under the box, not only in the table's heading.
    expect(document.querySelector("p.bitflow-hint code")?.textContent).toBe(
      "A ∨ B ∧ C",
    );
  });

  it("leaves what was typed exactly as typed", () => {
    render(<Editing initial={data()} />);

    fireEvent.change(expressionBox(), { target: { value: "A AND B" } });

    expect(expressionBox().value).toBe("A AND B");
  });

  it("says what is wrong instead of storing half an expression", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(expressionBox(), { target: { value: "A AND" } });

    expect(screen.getByRole("alert")).toBeTruthy();
    // The last expression that parsed stays in the document.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("counts the rows the variables will make", () => {
    render(<Editing initial={data({ variables: ["A", "B", "C"] })} />);

    expect(screen.getByText("8 row(s).")).toBeTruthy();
  });

  it("takes the variables one per line", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(screen.getByLabelText("Variables"), {
      target: { value: "P\nQ\n R " },
    });

    expect((onChange.mock.calls[0][0] as Data).variables).toEqual(["P", "Q", "R"]);
  });

  /**
   * The expression is the answer key, so there is nothing else to check it
   * against — the finished table is the only place an author sees what they
   * actually wrote.
   */
  it("shows the finished table, worked out", () => {
    const { container } = render(<Editing initial={data()} />);

    const preview = container.querySelectorAll("table")[0];
    const values = [...preview.querySelectorAll("tbody select")].map(
      (select) => (select as HTMLSelectElement).value,
    );
    expect(values).toEqual(["0", "0", "1", "0"]);
    expect(
      [...preview.querySelectorAll("tbody select")].every(
        (select) => (select as HTMLSelectElement).disabled,
      ),
    ).toBe(true);
  });

  it("adds and removes a column", () => {
    render(<Editing initial={data()} />);

    fireEvent.click(screen.getByRole("button", { name: /add a column/i }));
    expect(screen.getByLabelText("Expression for column 2")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /^remove/i })[1]);
    expect(screen.queryByLabelText("Expression for column 2")).toBeNull();
  });
});
