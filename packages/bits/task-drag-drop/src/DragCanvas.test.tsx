import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DragCanvas } from "./DragCanvas";
import { DataSchema, type Data, type Placement } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    background: { src: "/cpu.png", alt: "A CPU diagram" },
    elements: [
      { id: "alu", label: "ALU", x: 0.02, y: 0.05, width: 0.2, height: 0.1 },
      { id: "reg", label: "Registers", x: 0.02, y: 0.2, width: 0.2, height: 0.1 },
    ],
    dropZones: [
      {
        id: "left",
        label: "Left block",
        x: 0.4,
        y: 0.05,
        width: 0.25,
        height: 0.2,
        correctElementIds: ["alu"],
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const setup = (over: Partial<Data> = {}, placements: Placement[] = []) => {
  const onChange = vi.fn();
  const utils = render(
    <DragCanvas
      data={data(over)}
      placements={placements}
      locale="en"
      onChange={onChange}
    />,
  );

  const area = utils.container.querySelector(
    ".bitflow-dragdrop-area",
  ) as HTMLElement;
  // jsdom gives everything a zero-sized box, and the canvas divides by it.
  area.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500 }) as DOMRect;

  const last = (): Placement[] =>
    onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, area, ...utils };
};

/**
 * One pointer gesture, in client pixels against a 1000×500 play area.
 *
 * `fireEvent` rather than `dispatchEvent`: each step is wrapped in `act`, so
 * React re-renders between them the way it does between real events.
 */
const drag = (target: HTMLElement, from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(target, { clientX: from[0], clientY: from[1], button: 0 });
  fireEvent.pointerMove(target, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(target, { clientX: to[0], clientY: to[1] });
};

/** Feeds its own changes back, for tests that take more than one step. */
const Stateful = ({ over = {} as Partial<Data>, initial = [] as Placement[] }) => {
  const [placements, setPlacements] = useState(initial);
  return (
    <DragCanvas
      data={data(over)}
      placements={placements}
      locale="en"
      onChange={setPlacements}
    />
  );
};

describe("<DragCanvas>", () => {
  it("leaves an element exactly where it was dropped", () => {
    const { last, getByRole } = setup();

    // Grabbed at its middle (120, 50) and released at (500, 250), so its
    // top-left lands at 0.4, 0.45 — nowhere near a region's edge.
    drag(getByRole("button", { name: "ALU" }), [120, 50], [500, 250]);

    expect(last()).toHaveLength(1);
    expect(last()[0].x).toBeCloseTo(0.4, 5);
    expect(last()[0].y).toBeCloseTo(0.45, 5);
  });

  it("keeps the element's size while it moves", () => {
    const { getByRole } = setup({}, [{ elementId: "alu", x: 0.5, y: 0.5 }]);
    const placed = getByRole("button", { name: /ALU, 50% across/ });

    // The size the author gave it, wherever it ends up: one that shrank to fit
    // would stop looking like the thing that was picked up.
    expect(placed.style.width).toBe("20%");
    expect(placed.style.height).toBe("10%");
  });

  it("does not snap an element to the region it is over", () => {
    const { last, getByRole } = setup();

    // Released just inside the region, well off its centre.
    drag(getByRole("button", { name: "ALU" }), [120, 50], [430, 80]);

    // Where it was put, not where the region is.
    expect(last()[0].x).not.toBeCloseTo(0.4, 3);
    expect(last()[0].y).toBeCloseTo(0.11, 2);
  });

  it("never draws the regions", () => {
    const { container } = setup();

    // They decide the marking and nothing else. Drawing one would say where
    // the answer goes.
    expect(container.querySelector(".bitflow-dragdrop-zone")).toBeNull();
    expect(screen.queryByText("Left block")).toBeNull();
  });

  it("keeps an element on the picture", () => {
    const { last, getByRole } = setup();

    drag(getByRole("button", { name: "ALU" }), [120, 50], [5000, 5000]);

    // Flush with the far edge rather than lost past it.
    expect(last()[0].x).toBeCloseTo(0.8, 5);
    expect(last()[0].y).toBeCloseTo(0.9, 5);
  });

  it("ignores a press that never became a drag", () => {
    const { onChange, getByRole } = setup();

    drag(getByRole("button", { name: "ALU" }), [120, 50], [121, 51]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves an element with the arrow keys", () => {
    const { last, getByRole } = setup();

    fireEvent.keyDown(getByRole("button", { name: "ALU" }), { key: "ArrowRight" });

    // The same freedom a pointer has: the regions are invisible, so there is
    // no list of them to choose from instead.
    expect(last()[0].x).toBeCloseTo(0.03, 5);
    expect(last()[0].y).toBeCloseTo(0.05, 5);
  });

  it("moves further with Shift held", () => {
    const { last, getByRole } = setup();

    fireEvent.keyDown(getByRole("button", { name: "ALU" }), {
      key: "ArrowDown",
      shiftKey: true,
    });

    expect(last()[0].y).toBeCloseTo(0.1, 5);
  });

  it("keeps moving from where it already is", async () => {
    render(<Stateful />);
    const element = screen.getByRole("button", { name: "ALU" });

    fireEvent.keyDown(element, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("button", { name: /ALU, 3%/ }), {
      key: "ArrowRight",
    });

    expect(screen.getByRole("button", { name: /ALU, 4%/ })).toBeDefined();
  });

  it("says where a moved element now is", () => {
    setup({}, [{ elementId: "alu", x: 0.5, y: 0.25 }]);

    // A position is the only honest thing to say: naming the region under it
    // would tell a screen-reader user what the picture does not tell anyone.
    expect(
      screen.getByRole("button", { name: "ALU, 50% across and 25% down" }),
    ).toBeDefined();
  });

  it("sends an element back on Backspace", () => {
    const { last } = setup({}, [{ elementId: "alu", x: 0.5, y: 0.25 }]);

    fireEvent.keyDown(screen.getByRole("button", { name: /ALU, 50% across/ }), {
      key: "Backspace",
    });

    expect(last()).toEqual([]);
  });

  it("takes a moved element off its starting place", () => {
    setup({}, [{ elementId: "alu", x: 0.5, y: 0.25 }]);

    expect(screen.queryByRole("button", { name: "ALU" })).toBeNull();
    expect(screen.getByRole("button", { name: "Registers" })).toBeDefined();
  });

  describe("an element that can be used more than once", () => {
    const cloning = (): Partial<Data> => ({
      elements: data().elements.map((element) =>
        element.id === "alu" ? { ...element, multiple: true } : element,
      ),
    });

    it("stays at its starting place after being used", () => {
      setup(cloning(), [{ elementId: "alu", x: 0.5, y: 0.25 }]);

      expect(
        screen.getByRole("button", { name: "ALU, can be used more than once" }),
      ).toBeDefined();
    });

    it("leaves a copy behind rather than moving", () => {
      const { last, getByRole } = setup(cloning(), [
        { elementId: "alu", x: 0.5, y: 0.25 },
      ]);

      drag(
        getByRole("button", { name: "ALU, can be used more than once" }),
        [120, 50],
        [700, 350],
      );

      expect(last()).toHaveLength(2);
      expect(last()[0]).toEqual({ elementId: "alu", x: 0.5, y: 0.25 });
    });
  });

  it("accepts nothing once the answer is in", () => {
    const onChange = vi.fn();
    render(
      <DragCanvas
        data={data()}
        placements={[{ elementId: "alu", x: 0.5, y: 0.25 }]}
        locale="en"
        readonly
        onChange={onChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: /ALU, 50% across/ }), {
      key: "ArrowRight",
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("spells each outcome out, not just in colour", () => {
    render(
      <DragCanvas
        data={data()}
        placements={[{ elementId: "reg", x: 0.45, y: 0.1 }]}
        judged={[{ elementId: "reg", x: 0.45, y: 0.1, zoneId: "left", state: "wrong" }]}
        locale="en"
        readonly
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/not correct/)).toBeDefined();
  });

  describe("once the answer is marked", () => {
    const marked = (
      judged: Array<{
        elementId: string;
        x: number;
        y: number;
        zoneId?: string;
        state?: "correct" | "wrong";
      }>,
      over: Partial<Data> = {},
    ) =>
      render(
        <DragCanvas
          data={data(over)}
          placements={judged.map(({ elementId, x, y }) => ({ elementId, x, y }))}
          judged={judged}
          locale="en"
          readonly
          onChange={() => {}}
        />,
      );

    it("shows the point a right placement earned", () => {
      marked([{ elementId: "alu", x: 0.45, y: 0.1, zoneId: "left", state: "correct" }]);

      expect(screen.getByText("+1")).toBeDefined();
      expect(screen.getByText(/one point/)).toBeDefined();
    });

    it("shows the point a wrong one cost", () => {
      marked([{ elementId: "reg", x: 0.45, y: 0.1, zoneId: "left", state: "wrong" }]);

      expect(screen.getByText("−1")).toBeDefined();
      expect(screen.getByText(/one point deducted/)).toBeDefined();
    });

    it("shows no deduction when wrong placements cost nothing", () => {
      marked([{ elementId: "reg", x: 0.45, y: 0.1, zoneId: "left", state: "wrong" }], {
        applyPenalties: false,
      });

      // A −1 would be a lie: with penalties off the placement is simply not
      // worth anything.
      expect(screen.queryByText("−1")).toBeNull();
      expect(screen.getByText(/not correct/)).toBeDefined();
    });

    it("shows no points at all when the task is worth one mark", () => {
      marked([{ elementId: "alu", x: 0.45, y: 0.1, zoneId: "left", state: "correct" }], {
        singlePoint: true,
      });

      // There is no per-element point to point at.
      expect(screen.queryByText("+1")).toBeNull();
    });

    it("marks an element left on nothing as its own thing", () => {
      const { container } = marked([{ elementId: "alu", x: 0.1, y: 0.8 }]);

      // Neither right nor wrong — it costs nothing — but not plain either,
      // which among red and green would read as "not looked at".
      expect(
        container.querySelector(".bitflow-dragdrop-element-adrift"),
      ).not.toBeNull();
      expect(screen.getByText(/not on any target/)).toBeDefined();
      expect(screen.queryByText("−1")).toBeNull();
    });

    it("colours a right and a wrong placement differently", () => {
      const { container } = marked([
        { elementId: "alu", x: 0.45, y: 0.1, zoneId: "left", state: "correct" },
        { elementId: "reg", x: 0.45, y: 0.3, zoneId: "left", state: "wrong" },
      ]);

      expect(container.querySelector(".bitflow-dragdrop-element-correct")).not.toBeNull();
      expect(container.querySelector(".bitflow-dragdrop-element-wrong")).not.toBeNull();
    });
  });

  it("describes the picture, because the picture is the task", () => {
    setup();
    expect(screen.getByAltText("A CPU diagram")).toBeDefined();
  });
});
