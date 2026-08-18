import { createAttempt, type AttemptSnapshot } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Flow } from "./Flow";
import { doc, edge, node, registerTestBits } from "./test-utils";

/**
 * Time limits are the one part of the runtime that acts on its own, without the
 * learner touching anything, so they are tested against a controlled clock
 * rather than a real one.
 */
describe("time limits", () => {
  beforeEach(() => {
    registerTestBits();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // `fireEvent` rather than `userEvent`: the latter waits on real timers
  // between keystrokes, which a frozen clock never delivers.
  const setup = (flow: ReturnType<typeof doc>) => {
    const onStateChange = vi.fn();
    const onComplete = vi.fn();
    render(
      <Flow
        flow={flow}
        locale="en"
        onStateChange={onStateChange}
        onComplete={onComplete}
      />,
    );
    return { onStateChange, onComplete };
  };

  const clickNext = () =>
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

  const lastSnapshot = (mock: ReturnType<typeof vi.fn>): AttemptSnapshot =>
    mock.mock.calls[mock.mock.calls.length - 1][0];

  const withLimits = (
    flowSeconds?: number,
    taskSeconds?: number,
  ): ReturnType<typeof doc> =>
    doc(
      [
        node("start", "test-start", { title: "Welcome" }),
        node("q", "test-task", {
          prompt: "Capital of France?",
          correct: "Paris",
          ...(taskSeconds === undefined
            ? {}
            : { evaluation: { timeLimit: taskSeconds } }),
        }),
        node("end", "test-end"),
      ],
      [edge("start", "q"), edge("q", "end")],
      flowSeconds === undefined ? {} : { timeLimit: flowSeconds },
    );

  it("shows no clock when neither the flow nor the task limits time", () => {
    setup(withLimits());
    expect(screen.queryByText("Time left")).toBeNull();
    expect(screen.queryByText("Time left on this task")).toBeNull();
  });

  it("counts the whole assessment down from the moment it starts", async () => {
    setup(withLimits(60));

    expect(screen.getByText("Time left")).toBeDefined();
    expect(screen.getByText("1:00")).toBeDefined();

    await vi.advanceTimersByTimeAsync(20_000);

    expect(screen.getByText("0:40")).toBeDefined();
  });

  it("completes the attempt when the whole assessment runs out", async () => {
    const { onComplete } = setup(withLimits(30));

    await vi.advanceTimersByTimeAsync(31_000);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(lastSnapshot(onComplete).status).toBe("completed");
  });

  it("stops counting once the attempt is over", async () => {
    const { onComplete } = setup(withLimits(30));

    await vi.advanceTimersByTimeAsync(60_000);

    // Expiry fires once, not once per tick past zero.
    expect(onComplete).toHaveBeenCalledOnce();
    expect(screen.queryByText("Time left")).toBeNull();
  });

  it("counts a task down only while the learner is on it", () => {
    setup(withLimits(undefined, 45));

    expect(screen.queryByText("Time left on this task")).toBeNull();

    clickNext();

    expect(screen.getByText("Time left on this task")).toBeDefined();
    expect(screen.getByText("0:45")).toBeDefined();
  });

  it("submits what the learner has when a task's time runs out", async () => {
    const { onStateChange } = setup(withLimits(undefined, 20));
    clickNext();
    fireEvent.change(screen.getByLabelText("Capital of France?"), {
      target: { value: "Par" },
    });

    await vi.advanceTimersByTimeAsync(21_000);

    // Graded, not discarded: a half-written answer is still their answer.
    const snapshot = lastSnapshot(onStateChange);
    expect(snapshot.results["q"].state).toBe("wrong");
    expect(snapshot.answers["q"]).toEqual({ text: "Par" });
  });

  it("leaves the attempt running when only the task's time runs out", async () => {
    const { onComplete } = setup(withLimits(undefined, 20));
    clickNext();

    await vi.advanceTimersByTimeAsync(21_000);

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDefined();
  });

  it("resumes a reloaded attempt with the time already spent", async () => {
    // Half the limit is banked on the current node, so the clock must open at
    // half — not restart, which would hand out free time on every reload.
    const flow = withLimits(60);
    const started = createAttempt(flow);
    if (!started.ok) throw started.error;
    const attempt: AttemptSnapshot = {
      ...started.value,
      elapsedMs: { start: 30_000 },
    };

    render(<Flow flow={flow} attempt={attempt} locale="en" />);

    expect(screen.getByText("0:30")).toBeDefined();
  });
});
