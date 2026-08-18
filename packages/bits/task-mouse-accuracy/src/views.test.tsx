import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

const empty = (): Data =>
  DataSchema.parse({ targets: [], aspectRatio: 1, evaluation: { mode: "skip" } });

const Editing = ({ onData }: { onData?: (data: Data) => void } = {}) => {
  const [data, setData] = useState(empty());
  onData?.(data);
  return (
    <Form data={data} locale="en" onChange={(next) => setData(next as Data)} errors={[]} />
  );
};

/** Gives the editing area a size, since jsdom reports every box as zero. */
const layOut = (container: HTMLElement) => {
  const area = container.querySelector(".bitflow-mouse-area") as HTMLElement;
  area.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  return area;
};

describe("<Form>", () => {
  it("adds a target where the author clicks", () => {
    let latest = empty();
    const { container } = render(<Editing onData={(data) => (latest = data)} />);

    fireEvent.click(layOut(container), { clientX: 100, clientY: 200 });

    expect(latest.targets).toHaveLength(1);
    expect(latest.targets[0].x).toBeCloseTo(0.25, 4);
    expect(latest.targets[0].y).toBeCloseTo(0.5, 4);
  });

  it("moves a target by dragging it", () => {
    let latest = empty();
    const { container } = render(<Editing onData={(data) => (latest = data)} />);
    fireEvent.click(layOut(container), { clientX: 100, clientY: 200 });

    const target = container.querySelector(".bitflow-mouse-target") as HTMLElement;
    fireEvent.pointerDown(target, { button: 0, clientX: 100, clientY: 200 });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 200 });
    fireEvent.pointerUp(window, { clientX: 300, clientY: 200 });

    expect(latest.targets[0].x).toBeCloseTo(0.75, 4);
    expect(latest.targets).toHaveLength(1);
  });

  it("does not add a target because a drag ended in a click", () => {
    let latest = empty();
    const { container } = render(<Editing onData={(data) => (latest = data)} />);
    fireEvent.click(layOut(container), { clientX: 100, clientY: 200 });

    const target = container.querySelector(".bitflow-mouse-target") as HTMLElement;
    fireEvent.pointerDown(target, { button: 0, clientX: 100, clientY: 200 });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 200 });
    fireEvent.pointerUp(window, { clientX: 300, clientY: 200 });
    fireEvent.click(layOut(container), { clientX: 300, clientY: 200 });

    expect(latest.targets).toHaveLength(1);
  });

  it("numbers the targets in the order they will be shown", () => {
    const { container } = render(<Editing />);
    const area = layOut(container);

    fireEvent.click(area, { clientX: 100, clientY: 100 });
    fireEvent.click(area, { clientX: 300, clientY: 300 });

    expect(
      [...container.querySelectorAll(".bitflow-mouse-target")].map((t) => t.textContent),
    ).toEqual(["1", "2"]);
  });

  it("asks for a time allowance only when speed is being counted", () => {
    render(<Editing />);

    expect(screen.queryByLabelText(/time allowed/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/^Count$/), {
      target: { value: "hitsAndSpeed" },
    });

    expect(screen.getByLabelText(/time allowed/i)).toBeDefined();
  });

  it("lets the author take the stand-down away, and says what that means", () => {
    let latest = empty();
    render(<Editing onData={(data) => (latest = data)} />);

    expect(latest.allowOptOut).toBe(true);
    expect(screen.getByText(/unmarked rather than wrong/i)).toBeDefined();

    fireEvent.click(screen.getByLabelText(/let the learner stand down/i));
    expect(latest.allowOptOut).toBe(false);
  });
});
