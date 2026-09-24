import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StepsGrid } from "./Grid";
import { DataSchema, type Answer, type Data } from "./schema";

const sort = DataSchema.parse({
  initial: ["5", "2", "8"],
  steps: [
    { id: "p1", label: "Pass 1", expected: ["2", "5", "8"] },
    { id: "p2", label: "Pass 2", expected: ["2", "5", "8"] },
  ],
  evaluation: defaultEvaluation(),
});

const stack = DataSchema.parse({
  mode: "write",
  initial: ["3"],
  steps: [
    { id: "push", label: "push(4)", expected: ["3", "4"] },
    { id: "pop", label: "pop()", expected: ["3"] },
  ],
  evaluation: defaultEvaluation(),
});

/** Holds the answer, so each change is drawn the way the element would. */
const Stateful = ({
  data,
  readonly,
  onAnswer,
}: {
  data: Data;
  readonly?: boolean;
  onAnswer?: (answer: Answer) => void;
}) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <StepsGrid
      data={data}
      answer={answer}
      readonly={readonly}
      locale="en"
      onChange={(next) => {
        setAnswer(next);
        onAnswer?.(next);
      }}
    />
  );
};

/** The values of one step's boxes, read off the buttons. */
const rowOf = (step: string) =>
  screen
    .getAllByRole("button", { name: new RegExp(`, ${step}$`) })
    .map((button) => button.textContent);

afterEach(() => document.body.replaceChildren());

describe("<StepsGrid> in rearrange mode", () => {
  it("starts every step from the array before it", () => {
    render(<Stateful data={sort} />);
    expect(rowOf("Pass 1")).toEqual(["5", "2", "8"]);
    expect(rowOf("Pass 2")).toEqual(["5", "2", "8"]);
  });

  it("swaps two boxes with two taps", () => {
    render(<Stateful data={sort} />);
    const [five, two] = screen.getAllByRole("button", { name: /Pass 1$/ });
    fireEvent.click(five);
    expect(five.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(two);

    expect(rowOf("Pass 1")).toEqual(["2", "5", "8"]);
    // The next step carries the new row forward.
    expect(rowOf("Pass 2")).toEqual(["2", "5", "8"]);
    expect(screen.getByRole("status").textContent).toBe(
      "Swapped 5 and 2 in Pass 1",
    );
  });

  it("puts a box down again when it is chosen twice, or on Escape", () => {
    render(<Stateful data={sort} />);
    const [five] = screen.getAllByRole("button", { name: /Pass 1$/ });
    fireEvent.click(five);
    fireEvent.click(five);
    expect(five.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(five);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(five.getAttribute("aria-pressed")).toBe("false");
  });

  it("moves between boxes with the arrow keys", () => {
    render(<Stateful data={sort} />);
    const [five, two] = screen.getAllByRole("button", { name: /Pass 1$/ });
    five.focus();
    fireEvent.keyDown(five, { key: "ArrowRight" });
    expect(document.activeElement).toBe(two);

    fireEvent.keyDown(two, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getAllByRole("button", { name: /Pass 2$/ })[1],
    );
  });

  it("changes nothing when read-only", () => {
    render(<Stateful data={sort} readonly />);
    const [five, two] = screen.getAllByRole("button", { name: /Pass 1$/ });
    fireEvent.click(five);
    fireEvent.click(two);
    expect(rowOf("Pass 1")).toEqual(["5", "2", "8"]);
  });
});

describe("<StepsGrid> in write mode", () => {
  it("gives every step as many boxes as the widest row", () => {
    render(<Stateful data={stack} />);
    expect(screen.getAllByRole("textbox", { name: /push\(4\)$/ })).toHaveLength(2);
  });

  it("records what is typed into a box", () => {
    let last: Answer | undefined;
    render(<Stateful data={stack} onAnswer={(answer) => (last = answer)} />);
    const second = screen.getAllByRole("textbox", { name: /push\(4\)$/ })[1];
    fireEvent.change(second, { target: { value: "4" } });
    expect(last?.rows[0]).toEqual(["3", "4"]);
  });

  it("leaves typing alone rather than autocorrecting it", () => {
    render(<Stateful data={stack} />);
    const box = screen.getAllByRole("textbox")[0];
    expect(box.getAttribute("autocapitalize")).toBe("off");
    expect(box.getAttribute("autocorrect")).toBe("off");
  });
});
