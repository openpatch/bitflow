import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { VIEW_HEIGHT, VIEW_WIDTH, yToView } from "./plot";
import { PlotView } from "./PlotView";
import { DataSchema, type Answer, type Data } from "./schema";

const plot = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    axes: {
      x: { min: -4, max: 4, step: 1 },
      y: { min: -5, max: 5, step: 1 },
    },
    target: "x",
    handles: [0],
    ...over,
  });

let latest: Answer = { values: {} };

const Stateful = ({
  data,
  readonly,
  states,
}: {
  data: Data;
  readonly?: boolean;
  states?: Record<string, "correct" | "wrong">;
}) => {
  const [answer, setAnswer] = useState<Answer>({ values: {} });
  latest = answer;
  return (
    <PlotView
      data={data}
      answer={answer}
      states={states}
      locale="en"
      readonly={readonly}
      onSet={(x, value) => setAnswer((current) => ({ values: { ...current.values, [x]: value } }))}
    />
  );
};

/** Stubs the diagram's box so a client y maps onto the viewBox one-to-one —
 *  jsdom gives every element a zero-sized box, and the plot divides by it. */
const stubDiagram = (container: HTMLElement) => {
  const svg = container.querySelector("svg.bitflow-function-plot-diagram") as SVGSVGElement;
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: VIEW_WIDTH, height: VIEW_HEIGHT }) as DOMRect;
  return svg;
};

afterEach(() => {
  document.body.replaceChildren();
  latest = { values: {} };
});

describe("<PlotView>", () => {
  it("sets a handle's value, snapped, when its track is tapped", () => {
    const data = plot();
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const track = container.querySelector(".bitflow-function-plot-track-hit")!;
    // 3.3 snaps to 3.5 at the default "half" snap with a y step of 1.
    fireEvent.click(track, { clientY: yToView(data.axes.y, 3.3) });

    expect(latest.values["0"]).toBeCloseTo(3.5);
  });

  it("drags a knob's value a pixel at a time", () => {
    const data = plot({ snap: "none" });
    const { container } = render(<Stateful data={data} />);
    stubDiagram(container);

    const handle = screen.getByRole("slider", { name: "Value at x = 0" });
    const from = yToView(data.axes.y, 0);
    const to = yToView(data.axes.y, 3);

    fireEvent.pointerDown(handle, { clientY: from, button: 0 });
    // One pixel at a time: the value is read from the pointer's absolute
    // position on every move, not accumulated from deltas, so a slow drag
    // lands on exactly the same place a single jump would.
    const step = to > from ? 1 : -1;
    for (let y = from; step > 0 ? y <= to : y >= to; y += step) {
      fireEvent.pointerMove(handle, { clientY: y });
    }
    fireEvent.pointerUp(handle, { clientY: to });

    expect(latest.values["0"]).toBeCloseTo(3, 0);
  });

  it("moves a focused knob with the keyboard: arrows, page keys, home and end", () => {
    const data = plot();
    render(<Stateful data={data} />);

    const handle = screen.getByRole("slider", { name: "Value at x = 0" });
    // Unset, a knob starts at 0 (inside the -5..5 axis).
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(latest.values["0"]).toBeCloseTo(0.5); // half the y step

    fireEvent.keyDown(handle, { key: "ArrowDown" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(latest.values["0"]).toBeCloseTo(-0.5);

    fireEvent.keyDown(handle, { key: "PageUp" });
    expect(latest.values["0"]).toBeCloseTo(4.5);

    fireEvent.keyDown(handle, { key: "End" });
    expect(latest.values["0"]).toBe(5);

    fireEvent.keyDown(handle, { key: "Home" });
    expect(latest.values["0"]).toBe(-5);
  });

  it("sets a handle's value from the number field under the plot", () => {
    const data = plot();
    render(<Stateful data={data} />);

    const field = screen.getByRole("textbox", { name: "y at x = 0" });
    fireEvent.change(field, { target: { value: "2.2" } });

    // Snapped to the nearest half step, same as everywhere else.
    expect(latest.values["0"]).toBeCloseTo(2);
  });

  it("offers no track, no slider and a disabled field when read-only", () => {
    const data = plot();
    const { container } = render(
      <PlotView data={data} answer={{ values: { "0": 1.5 } }} locale="en" readonly />,
    );

    expect(container.querySelector(".bitflow-function-plot-track-hit")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    const field = screen.getByRole("textbox", { name: "y at x = 0" }) as HTMLInputElement;
    expect(field.disabled).toBe(true);
    expect(field.value).toBe("1.5");
  });

  it("shows a verdict per handle once marked, and draws the target dashed", () => {
    const data = plot();
    render(
      <PlotView
        data={data}
        answer={{ values: { "0": 4 } }}
        states={{ "0": "wrong" }}
        locale="en"
        readonly
      />,
    );

    expect(document.querySelector(".bitflow-function-plot-verdict")?.textContent).toBe("✗");
    expect(screen.getByText("wrong")).toBeDefined();
    expect(document.querySelector(".bitflow-function-plot-target")).not.toBeNull();
  });

  it("hides the target curve before the task is marked", () => {
    const data = plot();
    render(<Stateful data={data} />);
    expect(document.querySelector(".bitflow-function-plot-target")).toBeNull();
  });

  it("always reveals the target in the authoring preview", () => {
    const data = plot();
    render(<PlotView data={data} locale="en" revealTarget />);
    expect(document.querySelector(".bitflow-function-plot-target")).not.toBeNull();
  });
});
