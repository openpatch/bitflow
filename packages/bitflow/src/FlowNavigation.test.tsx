import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Flow } from "./Flow";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { BitflowDocument } from "@bitflow/core";

const flow = (meta: Partial<BitflowDocument["meta"]> = {}): BitflowDocument =>
  doc(
    [
      node("start", "test-start", { title: "Welcome" }),
      node("q1", "test-task", { prompt: "First", correct: "a" }),
      node("q2", "test-task", { prompt: "Second", correct: "b" }),
      node("end", "test-end"),
    ],
    [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
    meta,
  );

const show = (document: BitflowDocument) =>
  render(<Flow flow={document} locale="en" />);

/** Start, answer the first question, and land on the second. */
const toSecond = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByLabelText("First"), "a");
  await user.click(screen.getByRole("button", { name: "Check" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
};

describe("how freely the learner may move", () => {
  beforeEach(registerTestBits);

  it("offers a way back by default", async () => {
    const user = userEvent.setup();
    show(flow());
    await toSecond(user);
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeNull();
  });

  it("offers no way back in a linear flow", async () => {
    const user = userEvent.setup();
    show(flow({ navigation: "linear" }));
    await toSecond(user);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("lists the steps when the flow allows free movement", async () => {
    const user = userEvent.setup();
    show(flow({ navigation: "free" }));
    await toSecond(user);

    const steps = screen.getByRole("navigation", { name: "Steps" });
    expect(steps).toBeDefined();
    expect(
      screen.getByRole("button", { name: /1\. Welcome/ }),
    ).toBeDefined();
  });

  it("shows no step list at the other settings", async () => {
    const user = userEvent.setup();
    show(flow());
    await toSecond(user);
    expect(screen.queryByRole("navigation", { name: "Steps" })).toBeNull();
  });

  it("says which steps still have no answer", async () => {
    const user = userEvent.setup();
    show(flow({ navigation: "free" }));
    await toSecond(user);

    expect(screen.getByRole("button", { name: /2\. First. Answered/ })).toBeDefined();
    // The one they are on is where they are, not something outstanding to go to.
    expect(screen.getByRole("button", { name: /3\. Second. You are here/ })).toBeDefined();
  });

  it("jumps back to a step from the list", async () => {
    const user = userEvent.setup();
    show(flow({ navigation: "free" }));
    await toSecond(user);

    await user.click(screen.getByRole("button", { name: /2\. First/ }));
    expect(screen.getByLabelText("First")).toBeDefined();
    // With the answer they gave still in it.
    expect((screen.getByLabelText("First") as HTMLInputElement).value).toBe("a");
  });

  it("will not offer the step they are already on", async () => {
    const user = userEvent.setup();
    show(flow({ navigation: "free" }));
    await toSecond(user);

    expect(
      (screen.getByRole("button", { name: /3\. Second/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe("passing on a task", () => {
  beforeEach(registerTestBits);

  it("offers Skip by default", async () => {
    const user = userEvent.setup();
    show(flow());
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeNull();
  });

  it("offers no Skip when the flow does not allow it", async () => {
    const user = userEvent.setup();
    show(flow({ allowSkip: false }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("lets one task insist on an answer in a flow that allows skipping", async () => {
    const user = userEvent.setup();
    const insisting = doc(
      [
        node("start", "test-start", { title: "Welcome" }),
        node("q1", "test-task", {
          prompt: "First",
          correct: "a",
          evaluation: { allowSkip: false },
        }),
        node("end", "test-end"),
      ],
      [edge("start", "q1"), edge("q1", "end")],
    );
    show(insisting);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });
});

describe("a section's material", () => {
  beforeEach(registerTestBits);

  const sectioned = doc(
    [
      node("start", "test-start", { title: "Welcome" }),
      { ...node("q1", "test-task", { prompt: "First", correct: "a" }), section: "reading" },
      { ...node("q2", "test-task", { prompt: "Second", correct: "b" }), section: "reading" },
      node("end", "test-end"),
    ],
    [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
    {
      sections: [
        {
          id: "reading",
          label: "Reading",
          markdown: "It was a **bright** cold day in April.",
        },
      ],
    },
  );

  it("shows the passage above every step in the section", async () => {
    const user = userEvent.setup();
    show(sectioned);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/bright/)).toBeDefined();
    expect(screen.getByText("Reading")).toBeDefined();

    // And again on the next question, which is the whole point: the passage is
    // written once and every question in the section gets it.
    await user.type(screen.getByLabelText("First"), "a");
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByLabelText("Second")).toBeDefined();
    expect(screen.getByText(/bright/)).toBeDefined();
  });

  it("shows nothing above a step outside the section", () => {
    show(sectioned);
    expect(screen.queryByText(/bright/)).toBeNull();
    expect(screen.queryByText("Reading")).toBeNull();
  });
});

describe("a connection that resets the step it lands on", () => {
  beforeEach(registerTestBits);

  /** Wrong answer, explanation, and back to the question to try again. */
  const loop = doc(
    [
      node("start", "test-start", { title: "Welcome" }),
      node("q", "test-task", { prompt: "First", correct: "a" }),
      node("why", "test-content", { text: "Because." }),
      node("end", "test-end"),
    ],
    [
      edge("start", "q"),
      edge("q", "why", {
        condition: {
          type: "compare",
          left: { kind: "result", nodeId: "q", path: "state" },
          op: "eq",
          right: "wrong",
        },
      }),
      edge("q", "end"),
      edge("why", "q", { resetTarget: "result" }),
    ],
  );

  it("hands the question back so it can be answered again", async () => {
    const user = userEvent.setup();
    show(loop);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("First"), "z");
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Because.")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Answerable again — without the reset this is the old answer, marked
    // wrong, with a Next button and no way to change it.
    const input = screen.getByLabelText("First") as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(screen.queryByRole("button", { name: "Check" })).not.toBeNull();
    // Their draft is still there to correct, which is what "try again" means.
    expect(input.value).toBe("z");
  });
});

describe("an end step when the run is over", () => {
  beforeEach(registerTestBits);

  /**
   * The trap this pins down: `<Flow>` stops accepting input once an answer is
   * graded or the attempt is complete, and an end step is only ever reached
   * when the attempt is complete. Passing that straight through left every end
   * step inert — the one that saves a copy of the work could not be clicked,
   * and the one that posts the attempt back to the host never posted it.
   */
  const withEnd = doc(
    [
      node("start", "test-start", { title: "Welcome" }),
      node("q1", "test-task", { prompt: "First", correct: "a" }),
      node("end", "test-acting-end", {}),
    ],
    [edge("start", "q1"), edge("q1", "end")],
  );

  const toEnd = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("First"), "a");
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
  };

  it("can still act, because acting is the whole of its job", async () => {
    const user = userEvent.setup();
    show(withEnd);
    await toEnd(user);

    const save = screen.getByRole("button", { name: "Save a copy" });
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it("still refuses to let a graded answer be changed", async () => {
    const user = userEvent.setup();
    show(flow());
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("First"), "a");
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect((screen.getByLabelText("First") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
