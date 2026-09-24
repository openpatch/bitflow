import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DataSchema, type Answer } from "./schema";
import { CodeListing, Stacks } from "./Stacks";

const data = DataSchema.parse({
  language: "Java",
  code: "void f() {\n  g();\n}",
  checkpoints: [
    { id: "a", label: "in g", line: 2, expected: [{ call: "g()", locals: "" }, { call: "f()", locals: "" }] },
    { id: "b", label: "back in f", expected: [{ call: "f()", locals: "" }] },
  ],
  evaluation: defaultEvaluation(),
});

let latest: Answer | undefined;

const Stateful = ({ readonly }: { readonly?: boolean }) => {
  const [answer, setAnswer] = useState<Answer>({ stacks: {} });
  latest = answer;
  return <Stacks data={data} answer={answer} locale="en" readonly={readonly} onChange={setAnswer} />;
};

afterEach(() => {
  document.body.replaceChildren();
  latest = undefined;
});

describe("<Stacks>", () => {
  it("pushes a frame on top and names it by its place", () => {
    render(<Stateful />);
    const [push] = screen.getAllByRole("button", { name: "Push" });
    fireEvent.click(push);
    fireEvent.change(screen.getByRole("textbox", { name: "Call, top frame, in g" }), {
      target: { value: "f()" },
    });
    fireEvent.click(push);
    fireEvent.change(screen.getByRole("textbox", { name: "Call, top frame, in g" }), {
      target: { value: "g()" },
    });
    expect(latest?.stacks.a).toEqual([
      { call: "g()", locals: "" },
      { call: "f()", locals: "" },
    ]);
  });

  it("starts the next moment from the stack before it, and pops its top", () => {
    render(<Stateful />);
    const [pushA] = screen.getAllByRole("button", { name: "Push" });
    fireEvent.click(pushA);
    fireEvent.click(pushA);
    // Moment b shows moment a's two frames until it is touched.
    expect(screen.getAllByRole("textbox", { name: /back in f$/ })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Pop" })[1]);
    expect(latest?.stacks.b).toHaveLength(1);
  });

  it("changes nothing when read-only", () => {
    render(<Stateful readonly />);
    expect(screen.queryByRole("button", { name: "Push" })).toBeNull();
  });
});

describe("<CodeListing>", () => {
  it("numbers the lines and marks each moment beside its line", () => {
    render(<CodeListing data={data} locale="en" />);
    expect(screen.getByText("The program (Java)")).toBeDefined();
    const second = screen.getAllByRole("listitem")[1];
    expect(second.textContent).toContain("2");
    expect(second.textContent).toContain("in g");
  });
});
