import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    background: { src: "", alt: "" },
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
      {
        id: "right",
        label: "Right block",
        x: 0.7,
        y: 0.05,
        width: 0.25,
        height: 0.2,
        correctElementIds: [],
      },
    ],
    evaluation: { ...defaultEvaluation(), mode: "skip" },
    ...over,
  });

/** The form is controlled, so edits have to be fed back to be seen. */
const Harness = ({ initial = data() }: { initial?: Data }) => {
  const [value, setValue] = useState(initial);
  return <Form data={value} locale="en" onChange={setValue} errors={[]} />;
};

/**
 * Gives the authoring canvas a size. jsdom reports every box as zero, and the
 * canvas divides by its width to turn a pointer into a fraction.
 */
const sizeCanvas = (container: HTMLElement) => {
  const area = container.querySelector(".bitflow-dragdrop-area") as HTMLElement;
  area.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500 }) as DOMRect;
  return area;
};

/** jsdom does not toggle a `<details>` when its summary is clicked. */
const openPanel = (name: string) => {
  const details = panel(name);
  details.open = true;
  details.dispatchEvent(new Event("toggle"));
};

/**
 * The disclosure whose summary is `name`.
 *
 * Scoped to summaries because a region's name is on the canvas handle too, and
 * a bare text lookup finds both.
 */
const panel = (name: string): HTMLDetailsElement => {
  const summary = screen
    .getAllByText(name)
    .find((node) => node.closest("summary"));
  if (!summary) throw new Error(`no panel named "${name}"`);
  return summary.closest("details") as HTMLDetailsElement;
};

describe("<Form>", () => {
  it("collapses every region to its name", () => {
    render(<Harness />);

    // A dozen regions is a dozen forms, and all of them at once is a wall.
    expect(panel("Left block").open).toBe(false);
    expect(panel("Right block").open).toBe(false);
  });

  it("says what a collapsed region expects, without opening it", () => {
    render(<Harness />);

    expect(screen.getByText("Expects ALU")).toBeDefined();
    expect(screen.getByText("Nothing belongs here yet")).toBeDefined();
  });

  it("says where a collapsed element belongs", () => {
    render(<Harness />);

    expect(screen.getByText("Belongs in Left block")).toBeDefined();
    // A distractor is worth calling out: it is easy to create by accident.
    expect(screen.getByText("A distractor — belongs nowhere")).toBeDefined();
  });

  it("names a region that has not been named yet, so it can still be found", () => {
    // Built without parsing: the schema refuses an unnamed region, and this is
    // exactly the state one is in the moment it is drawn. The form works on
    // drafts and reports the problem rather than refusing to show them.
    const draft = {
      ...data(),
      dropZones: [{ ...data().dropZones[0], label: "" }],
    } as Data;

    render(<Harness initial={draft} />);

    expect(screen.getByText("Unnamed region")).toBeDefined();
  });

  it("opens a region when it is asked for, and leaves the others shut", () => {
    render(<Harness />);

    openPanel("Left block");

    expect(panel("Left block").open).toBe(true);
    // Opening one is not a reason to open all of them.
    expect(panel("Right block").open).toBe(false);
  });

  it("opens the region that was touched on the canvas", () => {
    const { container } = render(<Harness />);
    sizeCanvas(container);
    const handle = container.querySelectorAll(".bitflow-dragdrop-handle-zone")[1];

    fireEvent.pointerDown(handle, { clientX: 750, clientY: 60, button: 0 });
    fireEvent.pointerUp(window, { clientX: 750, clientY: 60 });

    // Plainly the one being worked on, so its settings are what to show.
    expect(panel("Right block").open).toBe(true);
  });

  it("opens a newly added region, since naming it is the next thing", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Add a drop zone" }));

    expect(panel("Unnamed region").open).toBe(true);
  });

  it("opens a newly added element too", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Add an element" }));

    expect(panel("Unnamed element").open).toBe(true);
  });
});
