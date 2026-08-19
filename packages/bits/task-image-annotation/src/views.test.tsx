import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Answer, type Data, type Region } from "./schema";
import { Form, Task } from "./views";

const region = (over: Partial<Region> = {}): Region => ({
  id: "r",
  kind: "circle",
  x: 0.5,
  y: 0.5,
  radius: 0.1,
  width: 0.2,
  height: 0.2,
  label: "the middle",
  acceptedLabels: [],
  ...over,
});

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Mark the middle.",
    background: { src: "data:image/png;base64,x", alt: "A square" },
    regions: [region()],
    maximumCount: 1,
    ...over,
  });

const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task data={initial} answer={answer} locale="en" onAnswerChange={setAnswer} />
  );
};

const surface = () => screen.getByRole("button", { name: /A square/ });

describe("<Task>", () => {
  it("has nothing marked to begin with", () => {
    render(<Answering initial={data()} />);
    expect(screen.getByText("Nothing marked yet.")).toBeTruthy();
  });

  /**
   * Placing a mark is one decision — where — and a keyboard makes it exactly as
   * well as a pointer. There is no lesser path here.
   */
  it("places a point from the keyboard, at the crosshair", () => {
    render(<Answering initial={data()} />);

    // `detail: 0` is how a browser reports a button activated by Enter. It
    // still carries coordinates — zeros — so the position must come from the
    // aim, or Enter would always mark the corner.
    fireEvent.click(surface(), { detail: 0 });

    expect(screen.getByText(/Mark 1: 50% across, 50% down/)).toBeTruthy();
  });

  it("moves the aim with the arrow keys, and further with Shift", () => {
    render(<Answering initial={data()} />);

    fireEvent.keyDown(surface(), { key: "ArrowRight" });
    fireEvent.keyDown(surface(), { key: "ArrowDown", shiftKey: true });
    fireEvent.click(surface(), { detail: 0 });

    expect(screen.getByText(/Mark 1: 51% across, 55% down/)).toBeTruthy();
  });

  it("keeps the aim inside the picture", () => {
    render(<Answering initial={data()} />);

    for (let i = 0; i < 30; i++) {
      fireEvent.keyDown(surface(), { key: "ArrowLeft", shiftKey: true });
    }
    fireEvent.click(surface(), { detail: 0 });

    expect(screen.getByText(/Mark 1: 0% across/)).toBeTruthy();
  });

  it("places a box from the keyboard, a corner at a time", () => {
    render(<Answering initial={data({ annotationKind: "rect" })} />);

    fireEvent.click(surface(), { detail: 0 });
    // Nothing placed yet: that was the first corner.
    expect(screen.getByText("Nothing marked yet.")).toBeTruthy();

    fireEvent.keyDown(surface(), { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(surface(), { key: "ArrowDown", shiftKey: true });
    fireEvent.click(surface(), { detail: 0 });

    expect(screen.getByText(/Box 1: 50% across, 50% down, 5% wide, 5% tall/)).toBeTruthy();
  });

  it("lets a half-drawn box be abandoned", () => {
    render(<Answering initial={data({ annotationKind: "rect" })} />);

    fireEvent.click(surface(), { detail: 0 });
    fireEvent.keyDown(surface(), { key: "Escape" });
    fireEvent.keyDown(surface(), { key: "ArrowRight", shiftKey: true });
    fireEvent.click(surface(), { detail: 0 });

    // The first Enter set a corner that Escape cleared, so this one starts over.
    expect(screen.getByText("Nothing marked yet.")).toBeTruthy();
  });

  it("takes a mark off again", () => {
    render(<Answering initial={data()} />);
    fireEvent.click(surface(), { detail: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Remove mark 1" }));

    expect(screen.getByText("Nothing marked yet.")).toBeTruthy();
  });

  it("stops at the number of marks the author allowed", () => {
    render(<Answering initial={data()} />);

    fireEvent.click(surface(), { detail: 0 });

    expect(surface()).toHaveProperty("disabled", true);
  });

  it("asks for a name only when the author wants one", () => {
    const { unmount } = render(<Answering initial={data()} />);
    fireEvent.click(surface(), { detail: 0 });
    expect(screen.queryByLabelText("Name for mark 1")).toBeNull();
    unmount();

    render(<Answering initial={data({ requireLabel: true })} />);
    fireEvent.click(surface(), { detail: 0 });
    expect(screen.getByLabelText("Name for mark 1")).toBeTruthy();
  });

  it("says what each mark came to, in words", () => {
    const answer: Answer = {
      annotations: [
        { id: "a", kind: "point", x: 0.5, y: 0.5, width: 0, height: 0, label: "" },
      ],
    };
    render(
      <Task
        data={data()}
        answer={answer}
        result={evaluate({ data: data(), answer })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    // The outcome is never carried by the colour of an outline alone.
    expect(screen.getByText("the middle")).toBeTruthy();
  });

  it("names what was missed rather than only drawing it", () => {
    const answer: Answer = { annotations: [] };
    render(
      <Task
        data={data()}
        answer={answer}
        result={evaluate({ data: data(), answer })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(screen.getByText("Not marked: the middle")).toBeTruthy();
  });

  /** Outlining the answer beforehand would answer the question. */
  it("draws no region until the answer is in", () => {
    const { container, rerender } = render(<Answering initial={data()} />);
    expect(container.querySelectorAll(".bitflow-annotate-region")).toHaveLength(0);

    const answer: Answer = { annotations: [] };
    rerender(
      <Task
        data={data()}
        answer={answer}
        result={evaluate({ data: data(), answer })}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );
    expect(container.querySelectorAll(".bitflow-annotate-region")).toHaveLength(1);
  });
});

const Editing = ({ initial }: { initial: Data }) => {
  const [state, setState] = useState(initial);
  return <Form data={state} locale="en" onChange={setState} errors={[]} />;
};

describe("<Form>", () => {
  it("adds a region and opens it, since naming it is the next thing", () => {
    // Built rather than parsed: a task with no region yet is a state on the
    // way to a valid one, and the form still has to draw it.
    render(<Editing initial={{ ...data(), regions: [] }} />);

    fireEvent.click(screen.getByRole("button", { name: /add a region/i }));

    const panel = document.querySelector("fieldset details") as HTMLDetailsElement;
    expect(panel.open).toBe(true);
  });

  /**
   * Fewer marks than regions is a task nobody can finish. Drawing one raises
   * the ceiling rather than reporting a problem the next click would avoid.
   */
  it("raises the number of marks allowed with the regions", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add a region/i }));

    expect((onChange.mock.calls[0][0] as Data).maximumCount).toBe(2);
  });

  it("asks for synonyms only where a name is wanted", () => {
    const { unmount } = render(<Editing initial={data()} />);
    expect(screen.queryByLabelText(/other names that count/i)).toBeNull();
    unmount();

    render(<Editing initial={data({ requireLabel: true })} />);
    expect(screen.getByLabelText(/other names that count/i)).toBeTruthy();
  });

  it("asks how much of a box has to be right only when boxes are drawn", () => {
    const { unmount } = render(<Editing initial={data()} />);
    expect(screen.queryByLabelText(/how much of a box/i)).toBeNull();
    unmount();

    render(<Editing initial={data({ annotationKind: "rect" })} />);
    expect(screen.getByLabelText(/how much of a box/i)).toBeTruthy();
  });

  it("edits a region's position as a percentage", () => {
    const onChange = vi.fn();
    render(<Form data={data()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.change(screen.getByLabelText("Left (%)"), { target: { value: "25" } });

    expect((onChange.mock.calls[0][0] as Data).regions[0].x).toBeCloseTo(0.25, 5);
  });
});
