import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PixelGrid } from "./PixelGrid";
import { DataSchema, effectiveCells } from "./schema";

const data = DataSchema.parse({
  rows: 2,
  columns: 3,
  target: [
    ["black", "white", "black"],
    ["white", "black", "white"],
  ],
  given: [
    [false, false, false],
    [false, false, true],
  ],
  evaluation: defaultEvaluation(),
});

let latest: string[][] = [];

const Stateful = ({ readonly }: { readonly?: boolean }) => {
  const [cells, setCells] = useState(effectiveCells(data));
  latest = cells;
  return (
    <PixelGrid
      data={data}
      cells={cells}
      given={data.given}
      locale="en"
      readonly={readonly}
      onChange={setCells}
    />
  );
};

/** A 300 by 200 grid at the origin, so a cell is a 100px square. */
const layOut = () => {
  const grid = screen.getByRole("grid");
  grid.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 }) as DOMRect;
  return grid;
};

const chooseBlack = () =>
  fireEvent.click(screen.getByRole("radio", { name: /^1/ }));

afterEach(() => {
  document.body.replaceChildren();
  latest = [];
});

describe("<PixelGrid>", () => {
  it("paints the cell that is tapped with the chosen colour", () => {
    render(<Stateful />);
    const grid = layOut();
    chooseBlack();
    fireEvent.pointerDown(grid, { button: 0, clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window);
    expect(latest[0]).toEqual(["white", "black", "white"]);
  });

  it("paints every cell a drag passes over, a pixel at a time", () => {
    render(<Stateful />);
    const grid = layOut();
    chooseBlack();
    fireEvent.pointerDown(grid, { button: 0, clientX: 10, clientY: 50 });
    for (let x = 11; x <= 290; x++) {
      fireEvent.pointerMove(window, { clientX: x, clientY: 50 });
    }
    fireEvent.pointerUp(window);
    expect(latest[0]).toEqual(["black", "black", "black"]);
    expect(latest[1]).toEqual(["white", "white", "white"]);
  });

  it("will not repaint a locked cell", () => {
    render(<Stateful />);
    const grid = layOut();
    chooseBlack();
    fireEvent.pointerDown(grid, { button: 0, clientX: 250, clientY: 150 });
    fireEvent.pointerUp(window);
    expect(latest[1][2]).toBe("white");
  });

  it("paints from the keyboard, choosing the colour by its number", () => {
    render(<Stateful />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "2" });
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: " " });
    expect(latest[1][0]).toBe("black");
    expect(screen.getByRole("status").textContent).toBe("Selected colour: 1");
  });

  it("names each cell by colour and place, and says when it is locked", () => {
    render(<Stateful />);
    expect(
      screen.getAllByRole("gridcell").map((cell) => cell.getAttribute("aria-label")),
    ).toContain("0, row 2, column 3. locked");
  });

  it("changes nothing when read-only", () => {
    render(<Stateful readonly />);
    const grid = layOut();
    fireEvent.pointerDown(grid, { button: 0, clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window);
    expect(latest[0][1]).toBe("white");
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("keeps two grids on one page in separate colour groups", () => {
    render(
      <>
        <Stateful />
        <Stateful />
      </>,
    );
    const names = screen.getAllByRole("radio").map((radio) => radio.getAttribute("name"));
    expect(new Set(names).size).toBe(2);
  });
});
