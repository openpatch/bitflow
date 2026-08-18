import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  clampInspector,
  DEFAULT_INSPECTOR,
  InspectorResizer,
  MAX_INSPECTOR_RATIO,
  MIN_INSPECTOR,
} from "./InspectorResizer";

const setup = (width = DEFAULT_INSPECTOR, editorWidth = 1400) => {
  const onResize = vi.fn();
  render(
    <InspectorResizer
      width={width}
      editorWidth={editorWidth}
      locale="en"
      onResize={onResize}
    />,
  );
  const grip = screen.getByRole("separator");
  const last = () => onResize.mock.calls[onResize.mock.calls.length - 1][0];
  return { grip, onResize, last };
};

describe("clampInspector", () => {
  it("keeps the forms usable", () => {
    expect(clampInspector(40, 1400)).toBe(MIN_INSPECTOR);
  });

  it("never lets the inspector swallow the canvas", () => {
    // The canvas is the thing being edited; an inspector that covers it is a
    // worse tool than a narrow one.
    expect(clampInspector(9000, 1000)).toBe(1000 * MAX_INSPECTOR_RATIO);
  });

  it("leaves a reasonable width alone", () => {
    expect(clampInspector(500, 1400)).toBe(500);
  });

  it("still allows the minimum on a narrow editor", () => {
    // 60% of 300px would be below the minimum, and a zero-width inspector
    // helps nobody — the minimum wins.
    expect(clampInspector(400, 300)).toBe(MIN_INSPECTOR);
  });

  it("rounds to whole pixels", () => {
    expect(Number.isInteger(clampInspector(333.7, 1400))).toBe(true);
  });
});

describe("<InspectorResizer>", () => {
  it("is a separator that reports where it stands", () => {
    const { grip } = setup(400, 1400);

    // Not a decorative bar: assistive technology can read the width and the
    // range it may take.
    expect(grip.getAttribute("aria-orientation")).toBe("vertical");
    expect(grip.getAttribute("aria-valuenow")).toBe("400");
    expect(grip.getAttribute("aria-valuemin")).toBe(String(MIN_INSPECTOR));
    expect(grip.getAttribute("aria-valuemax")).toBe("840");
  });

  it("widens the inspector when dragged left", () => {
    const { grip, last } = setup(400, 1400);

    fireEvent.pointerDown(grip, { clientX: 900, button: 0 });
    fireEvent.pointerMove(window, { clientX: 800 });

    // The inspector grows from the right edge, so leftward is wider.
    expect(last()).toBe(500);
  });

  it("narrows it when dragged right", () => {
    const { grip, last } = setup(400, 1400);

    fireEvent.pointerDown(grip, { clientX: 900, button: 0 });
    fireEvent.pointerMove(window, { clientX: 980 });

    expect(last()).toBe(320);
  });

  it("stops responding once the drag is over", () => {
    const { grip, onResize } = setup(400, 1400);

    fireEvent.pointerDown(grip, { clientX: 900, button: 0 });
    fireEvent.pointerUp(window, { clientX: 900 });
    onResize.mockClear();
    fireEvent.pointerMove(window, { clientX: 700 });

    expect(onResize).not.toHaveBeenCalled();
  });

  it("resizes with the arrow keys", () => {
    const { grip, last } = setup(400, 1400);

    // Adjustable without a pointer, which a bare drag handle would not be.
    fireEvent.keyDown(grip, { key: "ArrowLeft" });
    expect(last()).toBe(416);

    fireEvent.keyDown(grip, { key: "ArrowRight" });
    expect(last()).toBe(384);
  });

  it("moves further with Shift held", () => {
    const { grip, last } = setup(400, 1400);

    fireEvent.keyDown(grip, { key: "ArrowLeft", shiftKey: true });

    expect(last()).toBe(464);
  });

  it("ignores keys that are not about width", () => {
    const { grip, onResize } = setup();

    fireEvent.keyDown(grip, { key: "Enter" });

    expect(onResize).not.toHaveBeenCalled();
  });

  it("keeps a dragged width within its limits", () => {
    const { grip, last } = setup(400, 1000);

    fireEvent.pointerDown(grip, { clientX: 900, button: 0 });
    fireEvent.pointerMove(window, { clientX: 100 });

    expect(last()).toBe(600);
  });
});
