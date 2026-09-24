import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataSchema, type Data, type PlacedLine } from "./schema";
import { Puzzle } from "./Puzzle";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    language: "python",
    lines: [
      { id: "total", text: "total = 0", indent: 0 },
      { id: "loop", text: "for value in values:", indent: 0 },
      { id: "add", text: "total += value", indent: 1 },
      { id: "stray", text: "print(values)", distractor: true },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const setup = (placed: PlacedLine[] = [], over: Partial<Data> = {}, props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Puzzle
      data={data(over)}
      placed={placed}
      locale="en"
      onChange={onChange}
      {...props}
    />,
  );
  const last = () => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

const Stateful = ({ over = {} as Partial<Data> }) => {
  const [placed, setPlaced] = useState<PlacedLine[]>([]);
  return (
    <Puzzle data={data(over)} placed={placed} locale="en" onChange={setPlaced} />
  );
};

const line = (start: string) =>
  screen.getByRole("button", { name: new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });

describe("<Puzzle>", () => {
  it("offers every line, including the ones that do not belong", () => {
    setup();

    // Deciding what is not part of the answer is the point of the exercise.
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(line("print(values)")).toBeDefined();
  });

  it("adds a chosen line to the program", () => {
    const { last } = setup();

    fireEvent.click(line("total = 0"));

    expect(last()).toEqual([{ lineId: "total", indent: 0 }]);
  });

  it("takes a line out of the bank once it is used", () => {
    setup([{ lineId: "total", indent: 0 }]);

    // One entry, in the program — not two, one in each list.
    expect(screen.getAllByRole("button", { name: /^total = 0/ })).toHaveLength(1);
    expect(line("total = 0").getAttribute("aria-label")).toContain("line 1 of 1");
  });

  it("puts a line back when it is chosen in the program", () => {
    const { last } = setup([{ lineId: "total", indent: 0 }]);

    fireEvent.click(line("total = 0"));

    expect(last()).toEqual([]);
  });

  it("moves a line with the arrow keys", () => {
    const { last } = setup([
      { lineId: "loop", indent: 0 },
      { lineId: "total", indent: 0 },
    ]);

    fireEvent.keyDown(line("total = 0"), { key: "ArrowUp" });

    expect(last()).toEqual([
      { lineId: "total", indent: 0 },
      { lineId: "loop", indent: 0 },
    ]);
  });

  it("takes a line out with Backspace", () => {
    const { last } = setup([{ lineId: "total", indent: 0 }]);

    fireEvent.keyDown(line("total = 0"), { key: "Backspace" });

    expect(last()).toEqual([]);
  });

  describe("when indentation is part of the answer", () => {
    const over = { indentationMatters: true };

    it("indents and outdents with the arrow keys", () => {
      const { last } = setup([{ lineId: "add", indent: 0 }], over);

      fireEvent.keyDown(line("total += value"), { key: "ArrowRight" });
      expect(last()).toEqual([{ lineId: "add", indent: 1 }]);
    });

    it("does not outdent past the margin", () => {
      const { onChange } = setup([{ lineId: "add", indent: 0 }], over);

      fireEvent.keyDown(line("total += value"), { key: "ArrowLeft" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("says how far a line is indented", () => {
      setup([{ lineId: "add", indent: 2 }], over);
      expect(line("total += value").getAttribute("aria-label")).toContain(
        "indented 2",
      );
    });
  });

  it("refuses to indent when indentation is not part of the answer", () => {
    const { onChange } = setup([{ lineId: "add", indent: 0 }]);

    fireEvent.keyDown(line("total += value"), { key: "ArrowRight" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("builds a whole program one line at a time", () => {
    const { container } = render(<Stateful />);

    fireEvent.click(line("total = 0"));
    fireEvent.click(line("for value in values:"));
    fireEvent.click(line("total += value"));

    // Three lines in the program, and the distractor still in the bank where
    // it belongs — leaving it there is part of the answer.
    expect(
      container.querySelectorAll(".bitflow-parsons-program li"),
    ).toHaveLength(3);
    expect(line("print(values)").getAttribute("aria-label")).toContain(
      "to choose from",
    );
  });

  it("says what happened, since the lists move under the learner", () => {
    setup();

    fireEvent.click(line("total = 0"));

    expect(screen.getByRole("status").textContent).toBe(
      "total = 0 added as line 1.",
    );
  });

  describe("dragging a line in the program", () => {
    /** Gives the rows a height, since jsdom reports every box as zero. */
    const layOut = (container: HTMLElement) => {
      [...container.querySelectorAll(".bitflow-parsons-program li")].forEach(
        (row, index) => {
          (row as HTMLElement).getBoundingClientRect = () =>
            ({ top: index * 40, height: 40, left: 0, width: 300 }) as DOMRect;
        },
      );
    };

    const start = () =>
      setup([
        { lineId: "total", indent: 0 },
        { lineId: "loop", indent: 0 },
        { lineId: "add", indent: 0 },
      ]);

    it("lifts the line and leaves a gap where it will land", () => {
      const { container } = start();
      layOut(container);

      fireEvent.pointerDown(line("total += value"), {
        button: 0,
        clientX: 0,
        clientY: 90,
      });
      fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });

      expect(container.querySelector(".bitflow-parsons-lifted")).not.toBeNull();
      expect(container.querySelector(".bitflow-parsons-line-gap")).not.toBeNull();
    });

    it("commits the order once, when the line is put down", () => {
      const { container, onChange, last } = start();
      layOut(container);

      fireEvent.pointerDown(line("total += value"), {
        button: 0,
        clientX: 0,
        clientY: 90,
      });
      fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.pointerUp(window, { clientX: 0, clientY: 5 });
      expect(last().map((entry: { lineId: string }) => entry.lineId)).toEqual([
        "add",
        "total",
        "loop",
      ]);
    });

    it("does not take the line out because the drag ended in a click", () => {
      const { container, last } = start();
      layOut(container);
      const row = line("total += value");

      fireEvent.pointerDown(row, { button: 0, clientX: 0, clientY: 90 });
      fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });
      fireEvent.pointerUp(window, { clientX: 0, clientY: 5 });
      // The click the browser sends after the drag.
      fireEvent.click(row);

      expect(last()).toHaveLength(3);
    });

    it("takes a slow drag as seriously as a quick one", () => {
      const { container, last } = start();
      layOut(container);
      const row = line("total += value");

      fireEvent.pointerDown(row, { button: 0, clientX: 0, clientY: 90 });
      // A pixel at a time: measured against the last position rather than the
      // first, none of these steps would count, the drag would be lost, and
      // the click that follows it would take the line out instead.
      for (let y = 88; y >= 5; y -= 2) {
        fireEvent.pointerMove(window, { clientX: 0, clientY: y });
      }
      fireEvent.pointerUp(window, { clientX: 0, clientY: 5 });
      fireEvent.click(row);

      expect(last().map((entry: PlacedLine) => entry.lineId)).toEqual([
        "add",
        "total",
        "loop",
      ]);
    });

    it("still takes a line out on a plain click", () => {
      const { last } = start();

      fireEvent.click(line("total += value"));

      expect(last()).toHaveLength(2);
    });

    it("does not start a drag from a touch on the line body", () => {
      const { container, onChange } = start();
      layOut(container);

      fireEvent.pointerDown(line("total += value"), {
        button: 0,
        pointerType: "touch",
        clientX: 0,
        clientY: 90,
      });
      fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });
      fireEvent.pointerUp(window, { clientX: 0, clientY: 5 });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("drags by the grip with a finger", () => {
      const { container, last } = start();
      layOut(container);
      const grip = line("total += value").querySelector(
        ".bitflow-parsons-grip",
      )!;

      fireEvent.pointerDown(grip, {
        button: 0,
        pointerType: "touch",
        clientX: 0,
        clientY: 90,
      });
      fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });
      fireEvent.pointerUp(window, { clientX: 0, clientY: 5 });

      expect(last().map((entry: PlacedLine) => entry.lineId)).toEqual([
        "add",
        "total",
        "loop",
      ]);
    });
  });

  describe("carrying a line between the lists", () => {
    /**
     * Puts the two lists side by side, since jsdom reports every box as zero:
     * the bank on the left, the program on the right, rows 40 high.
     */
    const layOut = (container: HTMLElement) => {
      const box = (element: Element | null, rect: Partial<DOMRect>) => {
        if (element) {
          (element as HTMLElement).getBoundingClientRect = () => rect as DOMRect;
        }
      };
      box(container.querySelectorAll("section")[0], {
        left: 0,
        right: 300,
        top: 0,
        bottom: 400,
        width: 300,
      });
      box(container.querySelector(".bitflow-parsons-target"), {
        left: 400,
        right: 700,
        top: 0,
        bottom: 400,
        width: 300,
      });
      box(container.querySelector(".bitflow-parsons-program"), {
        left: 400,
        right: 700,
        top: 0,
        bottom: 400,
        width: 300,
      });
      [...container.querySelectorAll(".bitflow-parsons-program li")].forEach(
        (row, index) => {
          const rect = {
            top: index * 40,
            bottom: index * 40 + 40,
            height: 40,
            left: 400,
            right: 700,
            width: 300,
          };
          box(row, rect);
          // The line itself is measured on pick-up, to keep hold of the point
          // it was taken by.
          box(row.querySelector(".bitflow-parsons-line"), rect);
        },
      );
    };

    it("drags a line out of the bank into the program", () => {
      const { container, last } = setup([{ lineId: "total", indent: 0 }]);
      layOut(container);

      fireEvent.pointerDown(line("for value in values:"), {
        button: 0,
        clientX: 100,
        clientY: 200,
      });
      fireEvent.pointerMove(window, { clientX: 500, clientY: 60 });
      fireEvent.pointerUp(window, { clientX: 500, clientY: 60 });

      expect(last().map((entry: PlacedLine) => entry.lineId)).toEqual([
        "total",
        "loop",
      ]);
    });

    it("drags a line back to the bank to take it out", () => {
      const { container, last } = setup([
        { lineId: "total", indent: 0 },
        { lineId: "loop", indent: 0 },
      ]);
      layOut(container);

      fireEvent.pointerDown(line("total = 0"), {
        button: 0,
        clientX: 450,
        clientY: 20,
      });
      fireEvent.pointerMove(window, { clientX: 100, clientY: 200 });
      fireEvent.pointerUp(window, { clientX: 100, clientY: 200 });

      expect(last().map((entry: PlacedLine) => entry.lineId)).toEqual(["loop"]);
    });

    it("shows the line on its way back before it is let go", () => {
      const { container, onChange } = setup([
        { lineId: "total", indent: 0 },
        { lineId: "loop", indent: 0 },
      ]);
      layOut(container);

      fireEvent.pointerDown(line("total = 0"), {
        button: 0,
        clientX: 450,
        clientY: 20,
      });
      fireEvent.pointerMove(window, { clientX: 100, clientY: 200 });

      // The program has already closed up, and nothing is committed yet.
      expect(container.querySelectorAll(".bitflow-parsons-program li")).toHaveLength(1);
      expect(container.querySelector(".bitflow-parsons-lifted-out")).not.toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("indents a line by dragging it to the right", () => {
      const { container, last } = setup(
        [
          { lineId: "loop", indent: 0 },
          { lineId: "add", indent: 0 },
        ],
        { indentationMatters: true },
      );
      layOut(container);

      fireEvent.pointerDown(line("total += value"), {
        button: 0,
        clientX: 410,
        clientY: 60,
      });
      // 48px right of the program's edge, which is two steps of 1.5rem.
      fireEvent.pointerMove(window, { clientX: 458, clientY: 60 });
      fireEvent.pointerUp(window, { clientX: 458, clientY: 60 });

      expect(last()).toEqual([
        { lineId: "loop", indent: 0 },
        { lineId: "add", indent: 2 },
      ]);
    });

    it("indents a line by dragging it with a finger on the grip", () => {
      const { container, last } = setup(
        [
          { lineId: "loop", indent: 0 },
          { lineId: "add", indent: 0 },
        ],
        { indentationMatters: true },
      );
      layOut(container);
      const grip = line("total += value").querySelector(
        ".bitflow-parsons-grip",
      )!;

      fireEvent.pointerDown(grip, {
        button: 0,
        pointerType: "touch",
        clientX: 410,
        clientY: 60,
      });
      // 48px right of the program's edge, which is two steps of 1.5rem.
      fireEvent.pointerMove(window, { clientX: 458, clientY: 60 });
      fireEvent.pointerUp(window, { clientX: 458, clientY: 60 });

      expect(last()).toEqual([
        { lineId: "loop", indent: 0 },
        { lineId: "add", indent: 2 },
      ]);
    });

    it("does not indent by dragging when indentation is not part of the answer", () => {
      const { container, last } = setup([
        { lineId: "loop", indent: 0 },
        { lineId: "add", indent: 0 },
      ]);
      layOut(container);

      fireEvent.pointerDown(line("total += value"), {
        button: 0,
        clientX: 410,
        clientY: 60,
      });
      fireEvent.pointerMove(window, { clientX: 458, clientY: 10 });
      fireEvent.pointerUp(window, { clientX: 458, clientY: 10 });

      expect(last()).toEqual([
        { lineId: "add", indent: 0 },
        { lineId: "loop", indent: 0 },
      ]);
    });

    it("keeps a line the drag never left the bank with out of the program", () => {
      const { container, onChange } = setup([]);
      layOut(container);

      fireEvent.pointerDown(line("total = 0"), {
        button: 0,
        clientX: 100,
        clientY: 20,
      });
      fireEvent.pointerMove(window, { clientX: 120, clientY: 200 });
      fireEvent.pointerUp(window, { clientX: 120, clientY: 200 });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("marks each line, and tells a stray one from a misplaced one", () => {
    const { container } = setup(
      [
        { lineId: "total", indent: 0 },
        { lineId: "stray", indent: 0 },
      ],
      {},
      {
        outcomes: [
          { lineId: "total", placed: true, distractor: false },
          { lineId: "stray", placed: false, distractor: true },
        ],
        readonly: true,
      },
    );

    expect(container.querySelector(".bitflow-parsons-line-correct")).not.toBeNull();
    expect(container.querySelector(".bitflow-parsons-line-stray")).not.toBeNull();
    expect(screen.getByText("does not belong in the program")).toBeDefined();
  });

  it("says right place, wrong nesting, rather than only wrong", () => {
    setup(
      [{ lineId: "add", indent: 0 }],
      { indentationMatters: true },
      {
        outcomes: [
          { lineId: "add", placed: true, indented: false, distractor: false },
        ],
        readonly: true,
      },
    );

    expect(screen.getByText("right place, wrong indentation")).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { onChange } = setup([{ lineId: "total", indent: 0 }], {}, { readonly: true });

    fireEvent.keyDown(line("total = 0"), { key: "ArrowUp" });

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("<Puzzle> buttons for a touch screen", () => {
  it("moves a line up and down", () => {
    const { last } = setup([
      { lineId: "total", indent: 0 },
      { lineId: "loop", indent: 0 },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Move for value in values: up" }));
    expect(last()).toEqual([
      { lineId: "loop", indent: 0 },
      { lineId: "total", indent: 0 },
    ]);
  });

  it("indents and outdents when indentation is part of the answer", () => {
    const { last } = setup([{ lineId: "add", indent: 1 }], { indentationMatters: true });
    fireEvent.click(screen.getByRole("button", { name: "Indent total += value" }));
    expect(last()).toEqual([{ lineId: "add", indent: 2 }]);
    fireEvent.click(screen.getByRole("button", { name: "Outdent total += value" }));
    expect(last()).toEqual([{ lineId: "add", indent: 0 }]);
  });

  it("offers no indenting when indentation is not asked for, and nothing when read-only", () => {
    setup([{ lineId: "add", indent: 0 }]);
    expect(screen.queryByRole("button", { name: /^Indent/ })).toBeNull();
    document.body.replaceChildren();
    setup([{ lineId: "add", indent: 0 }], {}, { readonly: true });
    expect(screen.queryByRole("button", { name: /^Move/ })).toBeNull();
  });
});

describe("<Puzzle> as a structogram", () => {
  it("draws a Verzweigung, its other case and a loop from the words on the lines", () => {
    const { container } = render(
      <Puzzle
        data={DataSchema.parse({
          display: "structogram",
          indentationMatters: true,
          lines: [
            { id: "if", text: "wenn x > 0", indent: 0 },
            { id: "a", text: "gib x aus", indent: 1 },
            { id: "else", text: "sonst", indent: 0 },
            { id: "loop", text: "solange x < 0", indent: 1 },
            { id: "b", text: "erhöhe x", indent: 2 },
          ],
          evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
        })}
        placed={[
          { lineId: "if", indent: 0 },
          { lineId: "a", indent: 1 },
          { lineId: "else", indent: 0 },
          { lineId: "loop", indent: 1 },
          { lineId: "b", indent: 2 },
        ]}
        locale="de"
        onChange={() => {}}
      />,
    );
    const kind = (id: string) =>
      container.querySelector(`.bitflow-parsons-program [data-line="${id}"]`)!.className;
    expect(kind("if")).toContain("bitflow-parsons-line-branch");
    expect(kind("else")).toContain("bitflow-parsons-line-else");
    expect(kind("loop")).toContain("bitflow-parsons-line-loop");
    expect(kind("a")).not.toMatch(/line-(branch|else|loop)/);
    expect(container.querySelector(".bitflow-parsons-cases")?.textContent).toBe("janein");
  });

  it("draws the same program as nested blocks, each set in by its level", () => {
    const { container } = setup(
      [
        { lineId: "loop", indent: 0 },
        { lineId: "add", indent: 1 },
      ],
      { display: "structogram", indentationMatters: true },
    );
    expect(container.querySelector(".bitflow-parsons-structogram")).not.toBeNull();
    const body = container.querySelector('.bitflow-parsons-program [data-line="add"]') as HTMLElement;
    expect(body.style.getPropertyValue("--bitflow-parsons-indent")).toBe("1.5rem");
  });
});
