import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Flow } from "./Flow";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { BitflowDocument } from "@bitflow/core";

const flow = (): BitflowDocument =>
  doc(
    [
      node("start", "test-start", { title: "Welcome" }),
      node("q1", "test-task", { prompt: "First", correct: "a" }),
      node("q2", "test-task", { prompt: "Second", correct: "b" }),
      node("end", "test-end"),
    ],
    [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
  );

const show = (lockedNodeIds?: string[]) =>
  render(<Flow flow={flow()} locale="en" lockedNodeIds={lockedNodeIds} />);

/** Start, answer the first question, and land on it ready to leave. */
const answerFirst = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByLabelText("First"), "a");
  await user.click(screen.getByRole("button", { name: "Check" }));
};

// The hold reason is announced with `role="status"`, but so is the step
// announcement the shell renders on every arrival — so the tests find the
// reason by its text, not by its role.
const holdReason = "Waiting for the teacher to open the next step.";

describe("a step the host is holding shut", () => {
  beforeEach(registerTestBits);

  it("disables Next while the step is held", async () => {
    const user = userEvent.setup();
    show(["q1"]);
    await answerFirst(user);

    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("renders the reason above the controls, before the Next button", async () => {
    const user = userEvent.setup();
    show(["q1"]);
    await answerFirst(user);

    const reason = screen.getByText(holdReason);
    const next = screen.getByRole("button", { name: "Next" });
    // The reason is the first child of the controls slot, so it precedes Next
    // in document order — which is the order a screen reader reads.
    expect(reason.compareDocumentPosition(next)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(reason.getAttribute("role")).toBe("status");
  });

  it("hides Skip while the step is held", async () => {
    const user = userEvent.setup();
    show(["q1"]);
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Before answering, Skip would normally be offered. A held step hides it,
    // because skipping past a gate defeats the gate.
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("re-enables Next when the id is removed", async () => {
    const user = userEvent.setup();
    const view = show(["q1"]);
    await answerFirst(user);

    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    view.rerender(<Flow flow={flow()} locale="en" lockedNodeIds={[]} />);
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    // And the reason is gone.
    expect(screen.queryByText(holdReason)).toBeNull();
  });

  it("leaves a step the learner is not on unaffected", async () => {
    const user = userEvent.setup();
    // q2 is locked, but the learner is on q1.
    show(["q2"]);
    await user.click(screen.getByRole("button", { name: "Next" }));

    // q1 is not held, so Skip is still offered and there is no hold reason.
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeNull();
    expect(screen.queryByText(holdReason)).toBeNull();
  });
});
