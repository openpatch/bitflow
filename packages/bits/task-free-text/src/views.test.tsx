import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Why does binary search need a sorted list?",
    marking: "keywords",
    criteria: [
      { id: "sorted", label: "Mentions sorted order", keywords: ["sorted"], points: 1 },
      { id: "halve", label: "Mentions halving", keywords: ["half", "middle"], points: 1 },
    ],
    ...over,
  });

/** The task driving itself, since the count only moves when the answer does. */
const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task data={initial} answer={answer} locale="en" onAnswerChange={setAnswer} />
  );
};

const box = () => screen.getByLabelText<HTMLTextAreaElement>("Your answer");

describe("<Task>", () => {
  /**
   * Said before they write. A learner who thinks a machine is grading their
   * paragraph writes for the machine, and one who does not know a person will
   * read it writes less than they would have.
   */
  it("says a person will read it, before the answer is written", () => {
    render(<Answering initial={data({ marking: "person" })} />);

    expect(screen.getByText(/read by a person/i)).toBeTruthy();
    expect(screen.getByText(/does not count for or against/i)).toBeTruthy();
  });

  it("says plainly that words are what is checked", () => {
    render(<Answering initial={data()} />);

    expect(
      screen.getByText(/for the words you used, not for what you meant/i),
    ).toBeTruthy();
  });

  it("shows the rubric before anything has been answered", () => {
    render(<Answering initial={data()} />);

    expect(screen.getByText("Mentions sorted order")).toBeTruthy();
  });

  it("counts what has been written", () => {
    render(<Answering initial={data()} />);

    fireEvent.change(box(), { target: { value: "Because." } });

    expect(screen.getByText(/8 characters/)).toBeTruthy();
  });

  it("counts towards a suggested length without blocking anything", () => {
    render(<Answering initial={data({ minimumLength: 40 })} />);

    fireEvent.change(box(), { target: { value: "Short." } });

    expect(screen.getByText(/6 of about 40 characters/)).toBeTruthy();
    // A minimum is a nudge; nothing is disabled by it.
    expect(box().disabled).toBe(false);
  });

  it("holds the box to a maximum, so nobody writes past it", () => {
    render(<Answering initial={data({ maximumLength: 100 })} />);

    expect(box().maxLength).toBe(100);
    expect(screen.getByText(/0 of 100 characters/)).toBeTruthy();
  });

  it("marks each rubric line once the words have been looked for", () => {
    const answer = { text: "The list is sorted." };
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

    const met = container.querySelectorAll(".bitflow-free-text-criterion-met");
    const missed = container.querySelectorAll(
      ".bitflow-free-text-criterion-missed",
    );
    expect(met).toHaveLength(1);
    expect(missed).toHaveLength(1);
    // The glyph is decoration; the state is also in text for a screen reader.
    expect(screen.getByText("Mentioned")).toBeTruthy();
    expect(screen.getByText("Not mentioned")).toBeTruthy();
  });

  it("holds a rubric open with no verdict while it waits for a reader", () => {
    const answer = { text: "Because it halves a sorted list." };
    const withPerson = data({ marking: "person" });
    const { container } = render(
      <Task
        data={withPerson}
        answer={answer}
        result={evaluate({ data: withPerson, answer })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    // Neither met nor missed: nothing read it.
    expect(
      container.querySelectorAll(".bitflow-free-text-criterion-pending"),
    ).toHaveLength(2);
  });

  it("keeps a model answer back until the answer is in", () => {
    const withModel = data({ modelAnswer: "Because it halves the range." });
    const { rerender } = render(<Answering initial={withModel} />);
    expect(screen.queryByText(/halves the range/)).toBeNull();

    rerender(
      <Task
        data={withModel}
        answer={{ text: "x" }}
        result={evaluate({ data: withModel, answer: { text: "x" } })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(screen.getByText(/halves the range/)).toBeTruthy();
  });

  it("accepts no input once it is answered", () => {
    render(
      <Task data={data()} readonly locale="en" onAnswerChange={() => {}} />,
    );

    expect(box().disabled).toBe(true);
  });
});

const Editing = ({ initial }: { initial: Data }) => {
  const [state, setState] = useState(initial);
  return <Form data={state} locale="en" onChange={setState} errors={[]} />;
};

describe("<Form>", () => {
  it("adds a rubric line", () => {
    const onChange = vi.fn();
    // Built rather than parsed: half of what a form is for is the state on the
    // way to a valid one, and a task with no rubric yet is one of them.
    const empty: Data = { ...data(), criteria: [] };
    render(<Form data={empty} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add a rubric line/i }));

    expect((onChange.mock.calls[0][0] as Data).criteria).toHaveLength(1);
  });

  /**
   * A rubric a person marks by is a sentence. Asking for keywords beside it
   * would suggest something was going to read them.
   */
  it("asks for words only where something is going to look for them", () => {
    const { rerender } = render(
      <Form data={data({ marking: "person" })} locale="en" onChange={() => {}} errors={[]} />,
    );
    expect(screen.queryByLabelText(/words that count/i)).toBeNull();

    rerender(
      <Form data={data()} locale="en" onChange={() => {}} errors={[]} />,
    );
    expect(screen.getAllByLabelText(/words that count/i)).toHaveLength(2);
  });

  it("keeps one word per line", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(screen.getAllByLabelText(/words that count/i)[0], {
      target: { value: "sorted\nin order" },
    });

    expect((onChange.mock.calls[0][0] as Data).criteria[0].keywords).toEqual([
      "sorted",
      "in order",
    ]);
  });

  it("reorders the rubric", () => {
    render(<Editing initial={data()} />);

    fireEvent.click(
      screen.getByRole("button", { name: /move mentions sorted order down/i }),
    );

    const labels = screen
      .getAllByRole("textbox")
      .map((input) => (input as HTMLInputElement).value);
    expect(labels).toContain("Mentions halving");
    expect(labels.indexOf("Mentions halving")).toBeLessThan(
      labels.indexOf("Mentions sorted order"),
    );
  });

  it("removes a rubric line by name", () => {
    render(<Editing initial={data()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Mentions halving" }),
    );

    expect(screen.queryByDisplayValue("Mentions halving")).toBeNull();
  });

  it("says what each setting will actually do", () => {
    const { rerender } = render(
      <Form data={data({ marking: "person" })} locale="en" onChange={() => {}} errors={[]} />,
    );
    expect(screen.getByText(/neither rewards nor penalises/i)).toBeTruthy();

    rerender(<Form data={data()} locale="en" onChange={() => {}} errors={[]} />);
    expect(
      screen.getByText(/a good answer in other words scores zero/i),
    ).toBeTruthy();
  });
});
