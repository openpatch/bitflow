import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const graph = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Find the cheapest route from A to D.",
    weighted: true,
    nodes: [
      { id: "a", label: "A", x: 0.2, y: 0.2 },
      { id: "b", label: "B", x: 0.8, y: 0.2 },
      { id: "c", label: "C", x: 0.2, y: 0.8 },
      { id: "d", label: "D", x: 0.8, y: 0.8 },
    ],
    edges: [
      { id: "ab", source: "a", target: "b", weight: 1 },
      { id: "ac", source: "a", target: "c", weight: 4 },
      { id: "bd", source: "b", target: "d", weight: 1 },
      { id: "cd", source: "c", target: "d", weight: 5 },
    ],
    sourceId: "a",
    targetId: "d",
    ...over,
  });

/** The task driving itself, since the diagram only changes when the answer does. */
const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task data={initial} answer={answer} locale="en" onAnswerChange={setAnswer} />
  );
};

describe("<Task>", () => {
  it("draws a place and a connection for each one authored", () => {
    const { container } = render(<Answering initial={graph()} />);

    expect(container.querySelectorAll(".bitflow-graph-node")).toHaveLength(4);
    expect(container.querySelectorAll(".bitflow-graph-edge")).toHaveLength(4);
  });

  it("writes the graph out as well as drawing it", () => {
    // The picture must not be the only place the graph exists.
    render(<Answering initial={graph()} />);

    expect(screen.getByText(/^A joins B \(1\), C \(4\)\.$/)).toBeTruthy();
  });

  it("builds a route from the buttons alone", () => {
    render(<Answering initial={graph()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add A" }));
    fireEvent.click(screen.getByRole("button", { name: "Add B" }));

    const chosen = [...document.querySelectorAll(".bitflow-graph-chip")].map(
      (chip) => chip.textContent,
    );
    expect(chosen).toEqual(["A", "B"]);
  });

  it("takes the last one back", () => {
    render(<Answering initial={graph()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add A" }));
    fireEvent.click(screen.getByRole("button", { name: "Add B" }));
    fireEvent.click(screen.getByRole("button", { name: /remove the last/i }));

    expect(document.querySelectorAll(".bitflow-graph-chip")).toHaveLength(1);
  });

  it("reports the route as places, and never as both", () => {
    const onAnswerChange = vi.fn();
    render(<Task data={graph()} locale="en" onAnswerChange={onAnswerChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Add A" }));

    expect(onAnswerChange).toHaveBeenCalledWith({ nodeIds: ["a"], edgeIds: [] });
  });

  it("picks connections with checkboxes when a tree is wanted", () => {
    const onAnswerChange = vi.fn();
    render(
      <Task
        data={graph({ goal: "spanningTree", sourceId: "", targetId: "" })}
        locale="en"
        onAnswerChange={onAnswerChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "A to B, costing 1" }));

    expect(onAnswerChange).toHaveBeenCalledWith({ nodeIds: [], edgeIds: ["ab"] });
  });

  it("picks a side with checkboxes when a cut is wanted", () => {
    const onAnswerChange = vi.fn();
    render(
      <Task
        data={graph({ goal: "cut" })}
        locale="en"
        onAnswerChange={onAnswerChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: "A stays on A's side" }),
    );

    expect(onAnswerChange).toHaveBeenCalledWith({ nodeIds: ["a"], edgeIds: [] });
  });

  it("states the tie-break rule when the order depends on it", () => {
    render(
      <Answering initial={graph({ goal: "traversal", targetId: "" })} />,
    );

    expect(screen.getByText(/alphabetical order/i)).toBeTruthy();
  });

  it("says what was wrong with the answer, without saying what was right", () => {
    render(
      <Task
        data={graph()}
        answer={{ nodeIds: ["a", "c", "d"], edgeIds: [] }}
        result={{ state: "wrong", detail: { reason: "notShortest" } }}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(screen.getByText(/there is a cheaper one/i)).toBeTruthy();
  });

  it("still shows the answer once it is answered, but takes no more", () => {
    // What was chosen is most worth reading when it is being looked back at.
    const { container } = render(
      <Task
        data={graph()}
        answer={{ nodeIds: ["a", "b", "d"], edgeIds: [] }}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(
      [...container.querySelectorAll(".bitflow-graph-chip")].map((chip) => chip.textContent),
    ).toEqual(["A", "B", "D"]);
    expect(screen.getByRole("button", { name: "Add A" })).toHaveProperty("disabled", true);
  });
});

/** The form driving itself, since adding a place changes what else it offers. */
const Editing = ({ initial }: { initial: Data }) => {
  const [data, setData] = useState(initial);
  return <Form data={data} locale="en" onChange={setData} errors={[]} />;
};

const empty = (): Data => DataSchema.parse({ evaluation: { mode: "skip" } });

describe("<Form>", () => {
  it("names and places a new place without being asked twice", () => {
    const { container } = render(<Editing initial={empty()} />);

    fireEvent.click(screen.getByRole("button", { name: /add a place/i }));
    fireEvent.click(screen.getByRole("button", { name: /add a place/i }));

    expect(container.querySelectorAll(".bitflow-graph-node")).toHaveLength(2);
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("B").length).toBeGreaterThan(0);
  });

  it("takes a place's connections away with it", () => {
    const onChange = vi.fn();
    render(<Form data={graph()} locale="en" onChange={onChange} errors={[]} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^remove$/i })[0]);

    const next = onChange.mock.calls[0][0] as Data;
    expect(next.nodes.map((node) => node.id)).toEqual(["b", "c", "d"]);
    // A connection to a place that is gone joins nothing.
    expect(next.edges.map((edge) => edge.id)).toEqual(["bd", "cd"]);
    expect(next.sourceId).toBe("");
  });

  it("moves a place when it is dragged in the preview", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Form data={graph()} locale="en" onChange={onChange} errors={[]} />,
    );

    const svg = container.querySelector(".bitflow-graph-diagram") as SVGSVGElement;
    // jsdom has no layout, so the box the position is measured against has to
    // be supplied.
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 500, height: 300 }) as DOMRect;
    const node = container.querySelector(".bitflow-graph-node") as SVGGElement;

    // Held at its own middle — 0.2 of 500 by 0.2 of 300 — and dragged to the
    // centre of the diagram.
    fireEvent.pointerDown(node, { clientX: 100, clientY: 60 });
    fireEvent.pointerMove(window, { clientX: 250, clientY: 150 });

    const moved = (onChange.mock.calls.at(-1)?.[0] as Data).nodes[0];
    // Fractions, never pixels: the diagram is drawn at whatever size it gets.
    expect(moved.x).toBeCloseTo(0.5);
    expect(moved.y).toBeCloseTo(0.5);
  });

  it("does not snap a place under the cursor when it is grabbed by its edge", () => {
    // The offset is measured from where the drag began, so a place stays where
    // it is until the pointer actually moves.
    const onChange = vi.fn();
    const { container } = render(
      <Form data={graph()} locale="en" onChange={onChange} errors={[]} />,
    );

    const svg = container.querySelector(".bitflow-graph-diagram") as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 500, height: 300 }) as DOMRect;
    const node = container.querySelector(".bitflow-graph-node") as SVGGElement;

    fireEvent.pointerDown(node, { clientX: 115, clientY: 75 });
    fireEvent.pointerMove(window, { clientX: 115, clientY: 75 });

    const moved = (onChange.mock.calls.at(-1)?.[0] as Data).nodes[0];
    expect(moved.x).toBeCloseTo(0.2);
    expect(moved.y).toBeCloseTo(0.2);
  });

  it("asks for a finish only where the goal has one", () => {
    render(<Editing initial={graph({ goal: "spanningTree", directed: false })} />);

    expect(screen.queryByLabelText(/^finish$/i)).toBeNull();
    expect(screen.queryByLabelText(/^start$/i)).toBeNull();
  });

  it("asks which search only for a traversal", () => {
    render(<Editing initial={graph({ goal: "traversal", targetId: "" })} />);

    expect(screen.getByLabelText(/which search/i)).toBeTruthy();
  });
});
