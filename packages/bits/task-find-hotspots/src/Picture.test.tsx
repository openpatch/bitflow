import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Picture } from "./Picture";
import { DataSchema, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    background: { src: "data:image/png;base64,AAAA", alt: "A workstation" },
    hotspots: [
      {
        id: "keyboard",
        shape: "rect",
        x: 0.2,
        y: 0.6,
        width: 0.3,
        height: 0.2,
        correct: true,
        label: "The keyboard",
      },
      {
        id: "monitor",
        shape: "rect",
        x: 0.2,
        y: 0.1,
        width: 0.3,
        height: 0.3,
        correct: false,
        label: "The monitor",
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

/**
 * A pointer click. `detail` is the click count, and a real mouse sets it to 1;
 * `fireEvent` leaves it 0, which is what the component reads as "activated
 * from the keyboard".
 */
const clickAt = (surface: HTMLElement, clientX: number, clientY: number) =>
  fireEvent.click(surface, { clientX, clientY, detail: 1 });

const setup = (over: Partial<Data> = {}, props: Record<string, unknown> = {}) => {
  const onAnswerChange = vi.fn();
  const utils = render(
    <Picture
      data={data(over)}
      locale="en"
      onAnswerChange={onAnswerChange}
      {...props}
    />,
  );

  const picture = utils.container.querySelector(
    ".bitflow-hotspots-picture",
  ) as HTMLElement;
  // jsdom reports every box as zero, and a click is turned into a fraction.
  picture.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500 }) as DOMRect;

  const surface = screen.getByRole("button");
  const last = () =>
    onAnswerChange.mock.calls[onAnswerChange.mock.calls.length - 1][0];
  return { onAnswerChange, last, surface, ...utils };
};

describe("<Picture>", () => {
  it("records where the learner clicked, and what it hit", () => {
    const { surface, last } = setup();

    clickAt(surface, 300, 350);

    expect(last().selection).toEqual({ x: 0.3, y: 0.7, hotspotId: "keyboard" });
  });

  it("records a click on bare picture with no region", () => {
    const { surface, last } = setup();

    clickAt(surface, 900, 450);

    // The point is kept: a near miss is a different conversation from a wrong
    // answer, and it is the only record of this choice.
    expect(last().selection).toEqual({ x: 0.9, y: 0.9, hotspotId: undefined });
  });

  it("never draws the regions before the answer", () => {
    const { container } = setup();

    // The whole task is finding where something is; outlining the candidates
    // answers it.
    expect(container.querySelector(".bitflow-hotspots-handle")).toBeNull();
    expect(container.querySelector(".bitflow-hotspots-region")).toBeNull();
    expect(screen.queryByText("The keyboard")).toBeNull();
  });

  it("gives the picture one control, in the tab order", () => {
    setup();

    // Named by the picture's own description, so it is worth landing on.
    expect(screen.getByRole("button").getAttribute("aria-label")).toContain(
      "A workstation",
    );
  });

  it("moves the aim with the arrow keys", () => {
    const { surface } = setup();

    fireEvent.keyDown(surface, { key: "ArrowRight" });

    // Reported as a position, never as which region is under it: that would
    // tell a screen-reader user what the picture tells nobody.
    expect(screen.getByRole("status").textContent).toContain("51% across");
  });

  it("moves further with Shift held", () => {
    const { surface } = setup();

    fireEvent.keyDown(surface, { key: "ArrowDown", shiftKey: true });

    expect(screen.getByRole("status").textContent).toContain("55% down");
  });

  it("chooses wherever the aim was left, when activated by keyboard", () => {
    const { surface, last } = setup();

    fireEvent.keyDown(surface, { key: "ArrowLeft", shiftKey: true });
    fireEvent.keyDown(surface, { key: "ArrowUp", shiftKey: true });
    // A keyboard activation reports zeros for its coordinates, so the
    // crosshair supplies them — the same freedom a pointer has.
    fireEvent.click(surface, { clientX: 0, clientY: 0, detail: 0 });

    expect(last().selection.x).toBeCloseTo(0.45, 5);
    expect(last().selection.y).toBeCloseTo(0.45, 5);
  });

  it("says a choice was made without saying whether it was right", () => {
    const { surface } = setup();

    clickAt(surface, 300, 350);

    const said = screen.getByRole("status").textContent ?? "";
    expect(said).toContain("Chose");
    // Checking is what says that, and a pointer user is told no sooner.
    expect(said).not.toMatch(/correct/i);
  });

  it("shows the region that was hit, once it is marked", () => {
    const { container } = setup(
      {},
      {
        answer: { selection: { x: 0.3, y: 0.7, hotspotId: "keyboard" } },
        chosen: { hotspotId: "keyboard" },
        readonly: true,
      },
    );

    // A bare cross does not tell the learner what they actually hit.
    expect(
      container.querySelector(".bitflow-hotspots-region-correct"),
    ).not.toBeNull();
    expect(screen.getByText("You chose: The keyboard.")).toBeDefined();
  });

  it("says so when the answer landed on nothing", () => {
    setup(
      {},
      {
        answer: { selection: { x: 0.9, y: 0.9 } },
        chosen: { missed: true },
        readonly: true,
      },
    );

    expect(
      screen.getByText("You chose a part of the picture with nothing on it."),
    ).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { surface, onAnswerChange } = setup({}, { readonly: true });

    clickAt(surface, 300, 350);

    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it("describes the picture, because the picture is the task", () => {
    setup();
    expect(screen.getByAltText("A workstation")).toBeDefined();
  });
});
