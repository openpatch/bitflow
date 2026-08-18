import type { AttemptSnapshot } from "@bitflow/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Flow, type FlowHandle } from "./Flow";
import { doc, edge, node, registerTestBits, simpleFlow } from "./test-utils";

const setup = (props: Parameters<typeof Flow>[0] = {}) => {
  const onStateChange = vi.fn();
  const onSave = vi.fn();
  const onComplete = vi.fn();
  const onError = vi.fn();
  const ref = createRef<FlowHandle>();

  const utils = render(
    <Flow
      flow={simpleFlow}
      locale="en"
      onStateChange={onStateChange}
      onSave={onSave}
      onComplete={onComplete}
      onError={onError}
      ref={ref}
      {...props}
    />,
  );

  return { onStateChange, onSave, onComplete, onError, ref, ...utils };
};

const lastSnapshot = (mock: ReturnType<typeof vi.fn>): AttemptSnapshot =>
  mock.mock.calls[mock.mock.calls.length - 1][0];

describe("<Flow>", () => {
  beforeEach(registerTestBits);

  it("starts at the start bit", () => {
    setup();
    expect(screen.getByText("Welcome")).toBeDefined();
  });

  it("does not report a state change merely for loading a flow", () => {
    const { onStateChange } = setup();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("reports an invalid flow instead of rendering half of it", () => {
    const { onError } = setup({ flow: { version: 1, nodes: [] } as never });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].code).toBe("INVALID_FLOW");
  });

  describe("taking the flow", () => {
    it("advances to the next step", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup();

      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByLabelText("Capital of France?")).toBeDefined();
      expect(lastSnapshot(onStateChange).currentNodeId).toBe("q");
    });

    it("does not report a state change for every keystroke", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      onStateChange.mockClear();

      await user.type(screen.getByLabelText("Capital of France?"), "Paris");

      expect(onStateChange).not.toHaveBeenCalled();
    });

    it("evaluates the answer and reports the result", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));

      expect(screen.getByText("Correct")).toBeDefined();
      const snapshot = lastSnapshot(onStateChange);
      expect(snapshot.answers.q).toEqual({ text: "Paris" });
      expect(snapshot.results.q).toMatchObject({ state: "correct" });
      expect(snapshot.tries.q).toBe(1);
    });

    it("locks the answer once it has been checked", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));

      expect(
        (screen.getByLabelText("Capital of France?") as HTMLInputElement).disabled,
      ).toBe(true);
    });

    it("lets the learner try again when the bit allows it", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Lyon");
      await user.click(screen.getByRole("button", { name: "Check" }));
      expect(screen.getByText("Not correct")).toBeDefined();

      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(
        (screen.getByLabelText("Capital of France?") as HTMLInputElement).disabled,
      ).toBe(false);
      expect(lastSnapshot(onStateChange).results.q).toBeUndefined();
      // The try is history, and stays counted.
      expect(lastSnapshot(onStateChange).tries.q).toBe(1);
    });

    it("records a skip without scoring it", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Skip" }));

      expect(lastSnapshot(onStateChange).results.q).toEqual({ state: "unknown" });
    });

    it("goes back to the previous step", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(screen.getByText("Welcome")).toBeDefined();
    });

    it("completes on reaching the end bit", async () => {
      const user = userEvent.setup();
      const { onComplete } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByText("You have reached the end.")).toBeDefined();
      expect(screen.getByText("1 of 1 points")).toBeDefined();
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  describe("branching", () => {
    const branching = doc(
      [
        node("q", "test-task", { prompt: "Capital of France?", correct: "Paris" }),
        node("easy", "test-content", { text: "Let us try an easier one." }),
        node("hard", "test-content", { text: "Now a harder one." }),
        node("end", "test-end"),
      ],
      [
        edge("q", "easy"),
        edge("q", "hard", {
          id: "q->hard",
          condition: {
            type: "compare",
            left: { kind: "result", nodeId: "q", path: "state" },
            op: "eq",
            right: "correct",
          },
        }),
        edge("easy", "end"),
        edge("hard", "end"),
      ],
    );

    it("routes on the result of the answer", async () => {
      const user = userEvent.setup();
      setup({ flow: branching });

      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByText("Now a harder one.")).toBeDefined();
    });

    it("takes the fallback branch for a wrong answer", async () => {
      const user = userEvent.setup();
      setup({ flow: branching });

      await user.type(screen.getByLabelText("Capital of France?"), "Lyon");
      await user.click(screen.getByRole("button", { name: "Check" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByText("Let us try an easier one.")).toBeDefined();
    });
  });

  describe("branching on how many were correct", () => {
    /**
     * Two questions, then a fork: get both right and the flow moves on to the
     * harder path, otherwise it goes to the easier one.
     */
    const branching = doc(
      [
        node("q1", "test-task", { prompt: "One?", correct: "a" }),
        node("q2", "test-task", { prompt: "Two?", correct: "b" }),
        node("easy", "test-content", { text: "Let us go back a step." }),
        node("hard", "test-content", { text: "Ready for something harder." }),
        node("end", "test-end"),
      ],
      [
        edge("q1", "q2"),
        edge("q2", "easy"),
        edge("q2", "hard", {
          id: "q2->hard",
          condition: {
            type: "compare",
            left: { kind: "resultCount", state: "correct" },
            op: "gte",
            right: 2,
          },
        }),
        edge("easy", "end"),
        edge("hard", "end"),
      ],
    );

    const answer = async (
      user: ReturnType<typeof userEvent.setup>,
      prompt: string,
      text: string,
    ) => {
      await user.type(screen.getByLabelText(prompt), text);
      await user.click(screen.getByRole("button", { name: "Check" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
    };

    it("takes the harder path once enough are right", async () => {
      const user = userEvent.setup();
      setup({ flow: branching });

      await answer(user, "One?", "a");
      await answer(user, "Two?", "b");

      expect(screen.getByText("Ready for something harder.")).toBeDefined();
    });

    it("takes the easier path when they are not", async () => {
      const user = userEvent.setup();
      setup({ flow: branching });

      await answer(user, "One?", "a");
      await answer(user, "Two?", "wrong");

      expect(screen.getByText("Let us go back a step.")).toBeDefined();
    });

    it("counts only what the learner has reached", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup({ flow: branching });

      await answer(user, "One?", "a");
      // One correct so far, and the threshold is two.
      expect(lastSnapshot(onStateChange).currentNodeId).toBe("q2");
    });
  });

  describe("confidence and reasoning", () => {
    const asking = doc(simpleFlow.nodes, simpleFlow.edges, {
      askConfidence: true,
      askReasoning: true,
    });

    it("asks only after the task has been answered", async () => {
      const user = userEvent.setup();
      setup({ flow: asking });
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.queryByText("How sure are you?")).toBeNull();

      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));

      expect(screen.getByText("How sure are you?")).toBeDefined();
    });

    it("records confidence and reasoning in the snapshot", async () => {
      const user = userEvent.setup();
      const { onStateChange } = setup({ flow: asking });
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));

      await user.click(screen.getByRole("radio", { name: "Completely sure" }));
      expect(lastSnapshot(onStateChange).confidence?.q).toEqual({ level: 1 });

      await user.type(screen.getByLabelText("How did you get there?"), "I knew it.");
      expect(lastSnapshot(onStateChange).reasoning?.q).toBe("I knew it.");
    });
  });

  describe("attempt restore", () => {
    /** Plays through half the flow and returns the snapshot at that point. */
    const halfway = async () => {
      const user = userEvent.setup();
      const { onStateChange, unmount } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");
      await user.click(screen.getByRole("button", { name: "Check" }));
      const snapshot = lastSnapshot(onStateChange);
      unmount();
      return snapshot;
    };

    it("resumes at the same node with answers, results and tries intact", async () => {
      const snapshot = await halfway();

      render(<Flow flow={simpleFlow} attempt={snapshot} locale="en" />);

      expect(screen.getByLabelText("Capital of France?")).toBeDefined();
      expect(
        (screen.getByLabelText("Capital of France?") as HTMLInputElement).value,
      ).toBe("Paris");
      expect(screen.getByText("Correct")).toBeDefined();
    });

    it("resumes from the JSON a host would actually have stored", async () => {
      const snapshot = await halfway();

      render(
        <Flow flow={simpleFlow} attempt={JSON.stringify(snapshot)} locale="en" />,
      );

      expect(
        (screen.getByLabelText("Capital of France?") as HTMLInputElement).value,
      ).toBe("Paris");
    });

    it("refuses an attempt belonging to a different flow", async () => {
      const snapshot = await halfway();
      const onError = vi.fn();

      render(
        <Flow
          flow={simpleFlow}
          attempt={{ ...snapshot, flowId: "some-other-flow" }}
          locale="en"
          onError={onError}
        />,
      );

      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0].code).toBe("FLOW_ATTEMPT_MISMATCH");
      // The fresh attempt is untouched: still on the start node.
      expect(screen.getByText("Welcome")).toBeDefined();
    });

    it("refuses a malformed attempt without discarding the current one", () => {
      const onError = vi.fn();
      render(
        <Flow
          flow={simpleFlow}
          attempt={{ schemaVersion: 1 } as never}
          locale="en"
          onError={onError}
        />,
      );

      expect(onError.mock.calls[0][0].code).toBe("INVALID_ATTEMPT");
      expect(screen.getByText("Welcome")).toBeDefined();
    });
  });

  describe("imperative handle", () => {
    it("save() publishes the snapshot", async () => {
      const { ref, onSave } = setup();
      const snapshot = ref.current?.save();
      expect(onSave).toHaveBeenCalledOnce();
      expect(snapshot?.currentNodeId).toBe("start");
    });

    it("reset() starts a fresh attempt", async () => {
      const user = userEvent.setup();
      const { ref } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByLabelText("Capital of France?")).toBeDefined();

      ref.current?.reset();

      expect(await screen.findByText("Welcome")).toBeDefined();
    });

    it("reset() clears the answer the learner had typed", async () => {
      const user = userEvent.setup();
      const { ref } = setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Capital of France?"), "Paris");

      ref.current?.reset();
      await screen.findByText("Welcome");
      await user.click(screen.getByRole("button", { name: "Next" }));

      // Starting over means starting from a blank, not from the last answer.
      expect(
        (screen.getByLabelText("Capital of France?") as HTMLInputElement).value,
      ).toBe("");
    });
  });

  describe("moving between steps", () => {
    /** The `tabIndex={-1}` wrapper the runtime focuses on arrival. */
    const content = () =>
      document.querySelector(".bitflow-content") as HTMLElement;

    it("leaves focus alone on first render", () => {
      setup();
      // Mounting a widget must not yank focus off whatever the host page had.
      expect(document.activeElement).not.toBe(content());
    });

    it("moves focus to the step after Next", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole("button", { name: "Next" }));

      // Otherwise focus sits on a Next button that now means something else,
      // and a screen reader says nothing at all about the new question.
      expect(document.activeElement).toBe(content());
    });

    it("moves focus back after Back", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(document.activeElement).toBe(content());
    });

    it("does not steal focus while the learner answers in place", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Next" }));
      const input = screen.getByLabelText("Capital of France?");
      await user.type(input, "Paris");

      // Same node throughout, so nothing arrived and focus stays in the field.
      expect(document.activeElement).toBe(input);
    });

    it("announces each step to a screen reader", async () => {
      const user = userEvent.setup();
      setup();

      const status = screen.getByRole("status");
      expect(status.textContent).toBe("Step 1. Welcome");

      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByRole("status").textContent).toBe(
        "Step 2. Capital of France?",
      );
    });
  });

  describe("readonly", () => {
    it("shows the run without offering any way to change it", async () => {
      setup({ readonly: true });
      expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Check" })).toBeNull();
    });
  });

  it("keeps two flows on one page independent", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();

    render(
      <>
        <div data-testid="a">
          <Flow flow={simpleFlow} locale="en" onStateChange={first} />
        </div>
        <div data-testid="b">
          <Flow flow={simpleFlow} locale="en" onStateChange={second} />
        </div>
      </>,
    );

    await user.click(screen.getAllByRole("button", { name: "Next" })[0]);

    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });
});
