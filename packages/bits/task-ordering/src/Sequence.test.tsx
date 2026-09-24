import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Item } from "./schema";
import { Sequence } from "./Sequence";

const items: Item[] = [
  { id: "a", kind: "text", label: "Read the input" },
  { id: "b", kind: "text", label: "Sort it" },
  { id: "c", kind: "text", label: "Print the result" },
];

const setup = (order = ["c", "a", "b"], props: Record<string, unknown> = {}) => {
  const onReorder = vi.fn();
  const utils = render(
    <Sequence
      items={items}
      order={order}
      locale="en"
      onReorder={onReorder}
      {...props}
    />,
  );
  const last = () => onReorder.mock.calls[onReorder.mock.calls.length - 1][0];
  return { onReorder, last, ...utils };
};

/** Gives the rows a height, since jsdom reports every box as zero. */
const layOut = (container: HTMLElement) => {
  [...container.querySelectorAll("li")].forEach((row, index) => {
    row.getBoundingClientRect = () =>
      ({ top: index * 50, height: 50, left: 0, width: 200 }) as DOMRect;
  });
};

const Stateful = ({ initial = ["c", "a", "b"] }) => {
  const [order, setOrder] = useState(initial);
  return (
    <Sequence items={items} order={order} locale="en" onReorder={setOrder} />
  );
};

describe("<Sequence>", () => {
  it("shows the items in the order it was given", () => {
    setup();

    expect(
      screen.getAllByRole("button").map((b) => b.getAttribute("aria-label")),
    ).toEqual([
      "Print the result, 1 of 3",
      "Read the input, 2 of 3",
      "Sort it, 3 of 3",
    ]);
  });

  it("moves an item up with the arrow keys", () => {
    const { last } = setup();

    fireEvent.keyDown(screen.getByRole("button", { name: /Read the input/ }), {
      key: "ArrowUp",
    });

    expect(last()).toEqual(["a", "c", "b"]);
  });

  it("moves an item down with the arrow keys", () => {
    const { last } = setup();

    fireEvent.keyDown(screen.getByRole("button", { name: /Read the input/ }), {
      key: "ArrowDown",
    });

    expect(last()).toEqual(["c", "b", "a"]);
  });

  it("does not fall off either end", () => {
    const { onReorder } = setup();

    fireEvent.keyDown(screen.getByRole("button", { name: /Print the result/ }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("button", { name: /Sort it/ }), {
      key: "ArrowDown",
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("says where an item has landed", () => {
    setup();

    fireEvent.keyDown(screen.getByRole("button", { name: /Read the input/ }), {
      key: "ArrowUp",
    });

    // A list that silently rearranges itself is unusable without sight.
    expect(screen.getByRole("status").textContent).toBe(
      "Read the input moved to 1 of 3.",
    );
  });

  it("reorders by dragging past a neighbour's middle", () => {
    const { container, last } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    // Above the first row's midpoint, so it belongs at the top.
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 10 });

    expect(last()).toEqual(["b", "c", "a"]);
  });

  it("leaves a finger on the row to scroll the page", () => {
    const { container, onReorder } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, {
      button: 0,
      pointerType: "touch",
      clientX: 0,
      clientY: 120,
    });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 10 });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("drags by the grip with a finger", () => {
    const { container, last } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    const grip = third.querySelector(".bitflow-ordering-grip")!;
    fireEvent.pointerDown(grip, {
      button: 0,
      pointerType: "touch",
      clientX: 0,
      clientY: 120,
    });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 10 });

    expect(last()).toEqual(["b", "c", "a"]);
  });

  it("commits the order once, when the item is put down", () => {
    const { container, onReorder } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });

    // The answer is where the item was put down, not the path it took.
    expect(onReorder).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { clientX: 0, clientY: 10 });
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it("lifts the item and leaves a gap while it is being dragged", () => {
    const { container } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });

    // The item follows the cursor, and the list opens a hole where it would
    // land — without both, a drag is a list rearranging under your hand.
    expect(container.querySelector(".bitflow-ordering-lifted")).not.toBeNull();
    expect(container.querySelector(".bitflow-ordering-item-gap")).not.toBeNull();
  });

  it("takes a slow drag as seriously as a quick one", () => {
    const { container, onReorder } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    // A pixel at a time: measured against the last position rather than the
    // first, none of these steps would count and the drag would be lost.
    for (let y = 118; y >= 10; y -= 2) {
      fireEvent.pointerMove(window, { clientX: 0, clientY: y });
    }
    fireEvent.pointerUp(window, { clientX: 0, clientY: 10 });

    expect(onReorder).toHaveBeenCalled();
  });

  it("puts nothing down for a press that never moved", () => {
    const { container, onReorder } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 120 });

    expect(onReorder).not.toHaveBeenCalled();
    expect(container.querySelector(".bitflow-ordering-lifted")).toBeNull();
  });

  it("stops reordering once the drag is over", () => {
    const { container, onReorder } = setup();
    layOut(container);

    const third = screen.getByRole("button", { name: /Sort it/ });
    fireEvent.pointerDown(third, { button: 0, clientX: 0, clientY: 120 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 120 });
    onReorder.mockClear();
    fireEvent.pointerMove(window, { clientX: 0, clientY: 10 });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("keeps every item exactly once through a reorder", () => {
    render(<Stateful />);

    fireEvent.keyDown(screen.getByRole("button", { name: /Sort it/ }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("button", { name: /Sort it/ }), {
      key: "ArrowUp",
    });

    const labels = screen
      .getAllByRole("button")
      .map((b) => (b.getAttribute("aria-label") ?? "").split(",")[0]);
    expect([...labels].sort()).toEqual([
      "Print the result",
      "Read the input",
      "Sort it",
    ]);
  });

  it("marks each item where it sits, once the answer is in", () => {
    const { container } = setup(["a", "c", "b"], {
      correct: ["a"],
      readonly: true,
    });

    expect(
      container.querySelectorAll(".bitflow-ordering-item-correct"),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll(".bitflow-ordering-item-wrong"),
    ).toHaveLength(2);
    expect(screen.getAllByText("in the right place")).toHaveLength(1);
  });

  it("accepts nothing once the answer is in", () => {
    const { onReorder } = setup(["c", "a", "b"], { readonly: true });

    fireEvent.keyDown(screen.getByRole("button", { name: /Read the input/ }), {
      key: "ArrowUp",
    });

    expect(onReorder).not.toHaveBeenCalled();
  });
});
