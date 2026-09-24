import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { valueToView } from "./line";
import { NumberLineView } from "./NumberLineView";
import { DataSchema, type Answer, type Data } from "./schema";

const line = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    min: 0,
    max: 10,
    tickStep: 1,
    minorTicks: 3, // minor step 0.25
    items: [
      { id: "h", label: "Half", value: 5 },
      { id: "q", label: "Quarter", value: 2.5 },
    ],
    ...over,
  });

let latest: Answer = { positions: {} };

const Stateful = ({
  data,
  readonly,
  states,
}: {
  data: Data;
  readonly?: boolean;
  states?: Record<string, "correct" | "wrong">;
}) => {
  const [answer, setAnswer] = useState<Answer>({ positions: {} });
  latest = answer;
  return (
    <NumberLineView
      data={data}
      answer={answer}
      states={states}
      locale="en"
      readonly={readonly}
      onPlace={(itemId, value) => setAnswer({ positions: { ...answer.positions, [itemId]: value } })}
    />
  );
};

/** Stubs the diagram's box so a client x maps onto the viewBox one-to-one. */
const stubDiagram = (container: HTMLElement) => {
  const svg = container.querySelector("svg.bitflow-number-line-diagram") as SVGSVGElement;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 220 }) as DOMRect;
  return svg;
};

afterEach(() => {
  document.body.replaceChildren();
  latest = { positions: {} };
});

describe("<NumberLineView>", () => {
  it("places the active item where the line is tapped, snapped to the minor step", () => {
    const data = line();
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const catcher = container.querySelector(".bitflow-number-line-catcher")!;
    // 5.3 is nearest 5.25 at a 0.25 minor step.
    fireEvent.click(catcher, { clientX: valueToView(data, 5.3) });

    expect(latest.positions.h).toBeCloseTo(5.25);
  });

  it("moves on to the next unplaced item after a placement", () => {
    const data = line();
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const catcher = container.querySelector(".bitflow-number-line-catcher")!;
    fireEvent.click(catcher, { clientX: valueToView(data, 5) });

    // The palette should now have moved on to "Quarter".
    expect((screen.getByRole("radio", { name: "Quarter" }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("places whichever chip is chosen, not just the first item", () => {
    const data = line();
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    fireEvent.click(screen.getByRole("radio", { name: "Quarter" }));
    fireEvent.click(container.querySelector(".bitflow-number-line-catcher")!, {
      clientX: valueToView(data, 2.5),
    });

    expect(latest.positions).toEqual({ q: 2.5 });
    expect(latest.positions.h).toBeUndefined();
  });

  it("drags a placed marker along the line, a pixel at a time", () => {
    const data = line({ minorTicks: 0 }); // snap step 1, easy to reason about
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const catcher = container.querySelector(".bitflow-number-line-catcher")!;
    fireEvent.click(catcher, { clientX: valueToView(data, 5) });
    expect(latest.positions.h).toBe(5);

    const handle = screen.getByRole("slider", { name: "Half" });
    const from = valueToView(data, 5);
    const to = valueToView(data, 8);

    fireEvent.pointerDown(handle, { clientX: from, button: 0 });
    // One pixel at a time: a slow drag must still cross the drag threshold,
    // since it is measured from where the gesture began and not from the
    // last event.
    for (let x = from; x <= to; x += 1) {
      fireEvent.pointerMove(handle, { clientX: x });
    }
    fireEvent.pointerUp(handle, { clientX: to });

    expect(latest.positions.h).toBeCloseTo(8, 0);
  });

  it("does not move a marker on a plain tap — only selects it", () => {
    const data = line({ minorTicks: 0 });
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const catcher = container.querySelector(".bitflow-number-line-catcher")!;
    fireEvent.click(catcher, { clientX: valueToView(data, 5) });

    const handle = screen.getByRole("slider", { name: "Half" });
    fireEvent.pointerDown(handle, { clientX: valueToView(data, 5), button: 0 });
    fireEvent.pointerUp(handle, { clientX: valueToView(data, 5) });

    expect(latest.positions.h).toBe(5);
  });

  it("moves a focused marker with the arrow keys, by the snap step", () => {
    const data = line({ min: 0, max: 10, tickStep: 1, minorTicks: 3, snap: "minor" }); // step 0.25
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    fireEvent.click(container.querySelector(".bitflow-number-line-catcher")!, {
      clientX: valueToView(data, 5),
    });

    const handle = screen.getByRole("slider", { name: "Half" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(latest.positions.h).toBeCloseTo(5.25);

    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
    expect(latest.positions.h).toBeCloseTo(6.25);

    fireEvent.keyDown(handle, { key: "Home" });
    expect(latest.positions.h).toBe(0);

    fireEvent.keyDown(handle, { key: "End" });
    expect(latest.positions.h).toBe(10);
  });

  it("offers no palette, catcher or slider handles when read-only", () => {
    const data = line();
    const { container } = render(<Stateful data={data} readonly />);

    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(container.querySelector(".bitflow-number-line-catcher")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("says in words and with a symbol whether a placement was right, and draws the answer key", () => {
    const data = line();
    const { container } = render(
      <NumberLineView
        data={data}
        answer={{ positions: { h: 5, q: 9 } }}
        states={{ h: "correct", q: "wrong" }}
        locale="en"
        readonly
      />,
    );

    expect(container.querySelector(".bitflow-number-line-verdict-correct")?.textContent).toBe("✓");
    expect(container.querySelector(".bitflow-number-line-verdict-wrong")?.textContent).toBe("✗");
    expect(screen.getByText("correct")).toBeDefined();
    expect(screen.getByText("wrong")).toBeDefined();
    // The correct position is drawn even for the wrong placement.
    expect(container.querySelectorAll(".bitflow-number-line-answer")).toHaveLength(2);
  });
});
