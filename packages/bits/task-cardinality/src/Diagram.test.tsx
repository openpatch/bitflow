import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Diagram } from "./Diagram";
import { endStates } from "./evaluate";
import { DataSchema, type Answer } from "./schema";

const data = DataSchema.parse({
  notation: "chen",
  entities: [
    { id: "pupil", name: "Pupil", x: 0.2, y: 0.5 },
    { id: "book", name: "Book", x: 0.8, y: 0.5 },
  ],
  relationships: [
    { id: "borrows", name: "borrows", from: "pupil", to: "book", expectedFrom: "1", expectedTo: "n" },
  ],
  evaluation: defaultEvaluation(),
});

let latest: Answer | undefined;

const Stateful = () => {
  const [answer, setAnswer] = useState<Answer>({ ends: {} });
  latest = answer;
  return <Diagram data={data} answer={answer} locale="en" onChange={setAnswer} />;
};

afterEach(() => {
  document.body.replaceChildren();
  latest = undefined;
});

describe("<Diagram>", () => {
  it("answers each end from a select named by the relationship and the entity", () => {
    render(<Stateful />);
    const group = screen.getByRole("group", { name: "Pupil — borrows — Book" });
    expect(group).toBeDefined();
    fireEvent.change(screen.getByRole("combobox", { name: "At Book" }), { target: { value: "n" } });
    expect(latest?.ends).toEqual({ "borrows:to": "n" });
  });

  it("draws what was chosen at each end, and a question mark where nothing was", () => {
    const { container } = render(<Stateful />);
    fireEvent.change(screen.getByRole("combobox", { name: "At Pupil" }), { target: { value: "1" } });
    const ends = [...container.querySelectorAll(".bitflow-cardinality-end text")].map(
      (text) => text.textContent,
    );
    expect(ends).toEqual(["1", "?"]);
  });

  it("says whether an end was right in words, not only by colour", () => {
    const answer = { ends: { "borrows:from": "1", "borrows:to": "1" } };
    render(
      <Diagram
        data={data}
        answer={answer}
        states={endStates(data, answer)}
        readonly
        locale="en"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("correct")).toBeDefined();
    expect(screen.getByText("wrong")).toBeDefined();
  });

  it("shows the author the answers in the preview, with no controls", () => {
    const { container } = render(<Diagram data={data} locale="en" showAnswers />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(
      [...container.querySelectorAll(".bitflow-cardinality-end text")].map((text) => text.textContent),
    ).toEqual(["1", "n"]);
  });
});
