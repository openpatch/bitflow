import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Arena } from "./Arena";
import { outcomes } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    aspectRatio: 1,
    targets: [
      { id: "a", x: 0.25, y: 0.5, radius: 0.1 },
      { id: "b", x: 0.75, y: 0.5, radius: 0.1 },
    ],
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const empty = (): Answer => ({ rounds: [], optedOut: false });

const setup = (answer: Answer = empty(), props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Arena data={data()} answer={answer} locale="en" onChange={onChange} {...props} />,
  );
  const last = (): Answer => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

/** Feeds its own changes back, for tests that take more than one round. */
const Stateful = ({ over = {} as Partial<Data> }) => {
  const [answer, setAnswer] = useState<Answer>(empty());
  return <Arena data={data(over)} answer={answer} locale="en" onChange={setAnswer} />;
};

/** Gives the area a size, since jsdom reports every box as zero. */
const layOut = (container: HTMLElement) => {
  const area = container.querySelector(".bitflow-mouse-area");
  if (area) {
    (area as HTMLElement).getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  }
  return area as HTMLElement;
};

const clickAt = (container: HTMLElement, x: number, y: number) =>
  fireEvent.pointerDown(layOut(container), { clientX: x * 400, clientY: y * 400 });

const start = () => fireEvent.click(screen.getByRole("button", { name: "Start" }));

describe("<Arena>", () => {
  it("says what the task needs before it is started", () => {
    setup();

    // Said up front, not discovered by someone who cannot do it.
    expect(screen.getByText(/needs a mouse, a trackpad or a touchscreen/i)).toBeDefined();
    expect(screen.queryByText(/Target 1 of 2/)).toBeNull();
  });

  it("records a hit where the click landed", () => {
    const { container, last } = setup();
    start();

    clickAt(container, 0.25, 0.5);

    expect(last().rounds).toEqual([
      { targetId: "a", x: 0.25, y: 0.5, hit: true, ms: expect.any(Number) },
    ]);
  });

  it("records a miss, and moves on all the same", () => {
    const { container, last } = setup();
    start();

    clickAt(container, 0.6, 0.2);

    expect(last().rounds[0]).toMatchObject({ targetId: "a", hit: false });
  });

  it("keeps the click inside the task's own area, not the screen", () => {
    const { container, last } = setup();
    start();

    // Fractions of the play area: no window or screen coordinates, and
    // nothing about the device, ever leaves this component.
    clickAt(container, 0.3, 0.7);

    const round = last().rounds[0];
    expect(round.x).toBeCloseTo(0.3, 4);
    expect(round.y).toBeCloseTo(0.7, 4);
    expect(Object.keys(round).sort()).toEqual(["hit", "ms", "targetId", "x", "y"]);
  });

  it("shows one target at a time, in order", () => {
    const { container } = render(<Stateful />);
    start();

    expect(container.querySelectorAll(".bitflow-mouse-target")).toHaveLength(1);
    expect(screen.getByText("Target 1 of 2")).toBeDefined();

    clickAt(container, 0.25, 0.5);
    expect(screen.getByText("Target 2 of 2")).toBeDefined();
    expect(container.querySelectorAll(".bitflow-mouse-target")).toHaveLength(1);
  });

  it("stops once every target has been clicked", () => {
    const { container } = render(<Stateful />);
    start();

    clickAt(container, 0.25, 0.5);
    clickAt(container, 0.75, 0.5);
    clickAt(container, 0.75, 0.5);

    expect(screen.getByText("All 2 targets done.")).toBeDefined();
  });

  it("times each round from when its target appeared", () => {
    const { container, last } = setup();
    start();

    clickAt(container, 0.25, 0.5);

    // Monotonic, so a clock change mid-task cannot produce a negative time.
    expect(last().rounds[0].ms).toBeGreaterThanOrEqual(0);
  });

  describe("standing down", () => {
    it("is offered when the author allows it", () => {
      setup();

      expect(screen.getByRole("button", { name: /can't use a pointing device/i })).toBeDefined();
    });

    it("is not offered when the author does not", () => {
      render(<Arena data={data({ allowOptOut: false })} answer={empty()} locale="en" onChange={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /can't use/i })).toBeNull();
    });

    it("records the decision and asks for nothing else", () => {
      const { last, container } = setup();

      fireEvent.click(screen.getByRole("button", { name: /can't use a pointing device/i }));

      expect(last()).toEqual({ rounds: [], optedOut: true });
      expect(container.querySelector(".bitflow-mouse-area")).toBeNull();
    });

    it("says the task is not being marked rather than that it was failed", () => {
      setup({ rounds: [], optedOut: true });

      expect(screen.getByText(/not being marked/i)).toBeDefined();
    });
  });

  describe("trying again", () => {
    const finished = (): Answer => ({
      optedOut: false,
      rounds: [
        { targetId: "a", x: 0.25, y: 0.5, hit: true, ms: 400 },
        { targetId: "b", x: 0.6, y: 0.4, hit: false, ms: 700 },
      ],
    });

    it("starts a fresh run rather than coming back with nothing to click", () => {
      const onChange = vi.fn();
      const props = {
        data: data(),
        answer: finished(),
        locale: "en" as const,
        onChange,
      };
      const { rerender } = render(<Arena {...props} readonly />);

      // The host's "try again" clears the result and hands the task back
      // live, keeping the answer. For a recorded run that leaves nothing to
      // do, so the run has to be started over.
      rerender(<Arena {...props} readonly={false} />);

      expect(onChange).toHaveBeenCalledWith({ rounds: [], optedOut: false });
    });

    it("asks again before it starts timing", () => {
      const props = {
        data: data(),
        answer: finished(),
        locale: "en" as const,
        onChange: vi.fn(),
      };
      const { rerender } = render(<Arena {...props} readonly />);
      rerender(<Arena {...props} readonly={false} answer={empty()} />);

      // Back to the start screen, so the clock starts when the learner is
      // ready rather than when the button was pressed two screens ago.
      expect(screen.getByRole("button", { name: "Start" })).toBeDefined();
    });

    it("leaves a learner who stood down where they are", () => {
      const onChange = vi.fn();
      const props = {
        data: data(),
        answer: { rounds: [], optedOut: true },
        locale: "en" as const,
        onChange,
      };
      const { rerender } = render(<Arena {...props} readonly />);
      rerender(<Arena {...props} readonly={false} />);

      // Standing down is a decision, not an attempt to be redone.
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("shows where every click landed once the answer is in", () => {
    const answer: Answer = {
      optedOut: false,
      rounds: [
        { targetId: "a", x: 0.25, y: 0.5, hit: true, ms: 400 },
        { targetId: "b", x: 0.6, y: 0.4, hit: false, ms: 700 },
      ],
    };
    const { container } = setup(answer, {
      outcomes: outcomes(data(), answer),
      readonly: true,
    });

    // The pattern of the misses is the thing worth looking at.
    expect(container.querySelectorAll(".bitflow-mouse-mark-hit")).toHaveLength(1);
    expect(container.querySelectorAll(".bitflow-mouse-mark-miss")).toHaveLength(1);
    // And in words, in a table, rather than only as dots on a picture.
    expect(screen.getByText("Hit")).toBeDefined();
    expect(screen.getByText("Missed")).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { container, onChange } = setup(empty(), { readonly: true });

    clickAt(container, 0.25, 0.5);

    expect(onChange).not.toHaveBeenCalled();
  });
});
