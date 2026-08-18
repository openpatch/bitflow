import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorCanvas } from "./EditorCanvas";
import { DataSchema, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    background: { src: "/cpu.png", alt: "A CPU diagram" },
    elements: [
      { id: "alu", label: "ALU", x: 0.05, y: 0.05, width: 0.2, height: 0.1 },
    ],
    dropZones: [
      {
        id: "left",
        label: "Left block",
        x: 0.4,
        y: 0.2,
        width: 0.25,
        height: 0.2,
        correctElementIds: ["alu"],
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const setup = (over: Partial<Data> = {}) => {
  const onAddZone = vi.fn();
  const onMoveZone = vi.fn();
  const onMoveElement = vi.fn();
  const onSelect = vi.fn();

  const utils = render(
    <EditorCanvas
      data={data(over)}
      locale="en"
      onSelect={onSelect}
      onAddZone={onAddZone}
      onMoveZone={onMoveZone}
      onMoveElement={onMoveElement}
    />,
  );

  const area = utils.container.querySelector(
    ".bitflow-boxeditor-area",
  ) as HTMLElement;
  // jsdom gives every element a zero-sized box, and the canvas divides by it.
  area.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500 }) as DOMRect;

  return { area, onAddZone, onMoveZone, onMoveElement, onSelect, ...utils };
};

/**
 * One pointer gesture across the canvas, in client pixels.
 *
 * `fireEvent` rather than `dispatchEvent`: each step has to be wrapped in
 * `act` so React re-renders between them. Dispatched back to back, the move
 * and the release both read the state from before the press and do nothing.
 */
const drag = (
  target: HTMLElement,
  from: [number, number],
  to: [number, number],
) => {
  fireEvent.pointerDown(target, { clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(target, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(target, { clientX: to[0], clientY: to[1] });
};

describe("<EditorCanvas>", () => {
  it("draws a new drop zone where the author dragged", () => {
    const { area, onAddZone } = setup();

    // 1000×500, so a drag from (100,50) to (300,150) is 0.1,0.1 to 0.3,0.3.
    drag(area, [100, 50], [300, 150]);

    expect(onAddZone).toHaveBeenCalledOnce();
    const box = onAddZone.mock.calls[0][0];
    expect(box.x).toBeCloseTo(0.1, 5);
    expect(box.y).toBeCloseTo(0.1, 5);
    expect(box.width).toBeCloseTo(0.2, 5);
    expect(box.height).toBeCloseTo(0.2, 5);
  });

  it("draws the same rectangle dragged in either direction", () => {
    const { area, onAddZone } = setup();

    drag(area, [300, 150], [100, 50]);

    const box = onAddZone.mock.calls[0][0];
    expect(box.x).toBeCloseTo(0.1, 5);
    expect(box.y).toBeCloseTo(0.1, 5);
  });

  it("ignores a stray click rather than making a zone nobody can hit", () => {
    const { area, onAddZone } = setup();

    drag(area, [100, 50], [102, 51]);

    expect(onAddZone).not.toHaveBeenCalled();
  });

  it("shows the rectangle while it is being drawn", () => {
    const { area, container } = setup();

    fireEvent.pointerDown(area, { clientX: 100, clientY: 50 });
    fireEvent.pointerMove(area, { clientX: 300, clientY: 150 });

    const drawing = container.querySelector(".bitflow-boxeditor-drawing");
    expect(drawing).not.toBeNull();
    expect((drawing as HTMLElement).style.width).toBe("20%");
  });

  it("moves a zone that is dragged", () => {
    const { onMoveZone, container } = setup();
    const zone = container.querySelector(
      ".bitflow-dragdrop-handle-zone",
    ) as HTMLElement;

    drag(zone, [500, 150], [600, 200]);

    expect(onMoveZone).toHaveBeenCalledWith(
      "left",
      expect.objectContaining({ width: 0.25, height: 0.2 }),
    );
    const box = onMoveZone.mock.calls[0][1];
    // Moved by 0.1 across and 0.1 down; the size is untouched.
    expect(box.x).toBeCloseTo(0.5, 5);
    expect(box.y).toBeCloseTo(0.3, 5);
  });

  it("resizes a zone dragged by its corner", () => {
    const { onMoveZone, container } = setup();
    const handle = container.querySelector(
      ".bitflow-dragdrop-handle-zone .bitflow-boxeditor-resize",
    ) as HTMLElement;

    drag(handle, [650, 200], [750, 250]);

    const box = onMoveZone.mock.calls[0][1];
    expect(box.x).toBeCloseTo(0.4, 5);
    expect(box.width).toBeCloseTo(0.35, 5);
    expect(box.height).toBeCloseTo(0.3, 5);
  });

  it("keeps a moved zone inside the picture", () => {
    const { onMoveZone, container } = setup();
    const zone = container.querySelector(
      ".bitflow-dragdrop-handle-zone",
    ) as HTMLElement;

    drag(zone, [500, 150], [5000, 5000]);

    const box = onMoveZone.mock.calls[0][1];
    // Flush with the right and bottom edges, not beyond them.
    expect(box.x).toBeCloseTo(1 - box.width, 5);
    expect(box.y).toBeCloseTo(1 - box.height, 5);
  });

  it("moves an element too", () => {
    const { onMoveElement, container } = setup();
    const element = container.querySelector(
      ".bitflow-dragdrop-handle-element",
    ) as HTMLElement;

    drag(element, [100, 50], [200, 100]);

    expect(onMoveElement).toHaveBeenCalledWith("alu", expect.any(Object));
  });

  it("selects what was touched, so its fields can be found", () => {
    const { onSelect, container } = setup();
    const zone = container.querySelector(
      ".bitflow-dragdrop-handle-zone",
    ) as HTMLElement;

    drag(zone, [500, 150], [520, 160]);

    expect(onSelect).toHaveBeenCalledWith({ type: "zone", id: "left" });
  });

  it("names every box on the canvas", () => {
    setup();
    expect(screen.getByText("Left block")).toBeDefined();
    expect(screen.getByText("ALU")).toBeDefined();
  });
});
