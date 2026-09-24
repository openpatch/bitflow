import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cellStates } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";
import { FillableTable, TableEditor } from "./Table";

const data = DataSchema.parse({
  caption: "Result",
  columns: [
    { id: "x", header: "x", kind: "number" },
    { id: "y", header: "y", kind: "number" },
  ],
  rows: [
    { id: "r1", cells: { x: { given: "1" }, y: { accepted: ["2"] } } },
    { id: "r2", cells: { x: { given: "2" }, y: { accepted: ["4"] } } },
  ],
  evaluation: defaultEvaluation(),
});

afterEach(() => document.body.replaceChildren());

describe("<FillableTable>", () => {
  it("shows given cells as text and blank ones as inputs", () => {
    render(<FillableTable data={data} locale="en" onChange={() => {}} />);
    expect(screen.getByRole("table", { name: "Result" })).toBeDefined();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "1" })).toBeDefined();
  });

  it("records what is typed, cell by cell", () => {
    let last: Answer | undefined;
    const Stateful = () => {
      const [answer, setAnswer] = useState<Answer>({ cells: {} });
      return (
        <FillableTable
          data={data}
          answer={answer}
          locale="en"
          onChange={(next) => {
            last = next;
            setAnswer(next);
          }}
        />
      );
    };
    render(<Stateful />);
    fireEvent.change(screen.getByRole("textbox", { name: "y, Row 2" }), {
      target: { value: "4" },
    });
    expect(last).toEqual({ cells: { "r2:y": "4" } });
  });

  it("gives every blank a full keyboard that leaves the answer alone", () => {
    render(<FillableTable data={data} locale="en" onChange={() => {}} />);
    const input = screen.getAllByRole("textbox")[0];
    expect(input.getAttribute("inputmode")).toBe("text");
    expect(input.getAttribute("autocapitalize")).toBe("off");
    expect(input.getAttribute("autocorrect")).toBe("off");
  });

  it("says in words which cells were right, not only in colour", () => {
    const answer = { cells: { "r1:y": "2", "r2:y": "5" } };
    render(
      <FillableTable
        data={data}
        answer={answer}
        states={cellStates(data, answer)}
        readonly
        locale="en"
        onChange={() => {}}
      />,
    );
    const verdicts = [...document.querySelectorAll(".bitflow-visually-hidden")].map(
      (node) => node.textContent,
    );
    expect(verdicts).toEqual(["correct", "wrong"]);
  });
});

describe("<TableEditor>", () => {
  const Editing = ({ initial }: { initial: Data }) => {
    const [value, setValue] = useState(initial);
    return (
      <TableEditor
        data={value}
        locale="en"
        onChange={(rows) => setValue({ ...value, rows })}
      />
    );
  };

  it("lets an author type a second accepted answer after the separator", () => {
    render(<Editing initial={data} />);
    const input = screen.getByRole("textbox", {
      name: "y, Row 1: accepted answers",
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2 |" } });
    expect(input.value).toBe("2 |");
    fireEvent.change(input, { target: { value: "2 | two" } });
    expect(input.value).toBe("2 | two");
  });

  it("keeps a cell's text when it is switched between given and blank", () => {
    render(<Editing initial={data} />);
    fireEvent.change(screen.getByRole("combobox", { name: "x, Row 1: given or blank" }), {
      target: { value: "blank" },
    });
    expect(
      (screen.getByRole("textbox", { name: "x, Row 1: accepted answers" }) as HTMLInputElement)
        .value,
    ).toBe("1");
  });
});
