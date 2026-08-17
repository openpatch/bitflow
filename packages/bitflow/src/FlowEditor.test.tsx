import type { BitflowDocument } from "@bitflow/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlowEditor, type FlowEditorHandle } from "./FlowEditor";
import { doc, edge, node, registerTestBits, simpleFlow } from "./test-utils";

const setup = (props: Parameters<typeof FlowEditor>[0] = {}) => {
  const onEdit = vi.fn();
  const onSave = vi.fn();
  const onError = vi.fn();
  const ref = createRef<FlowEditorHandle>();

  const utils = render(
    <FlowEditor
      flow={simpleFlow}
      locale="en"
      onEdit={onEdit}
      onSave={onSave}
      onError={onError}
      ref={ref}
      {...props}
    />,
  );
  return { onEdit, onSave, onError, ref, ...utils };
};

const lastDoc = (mock: ReturnType<typeof vi.fn>): BitflowDocument =>
  mock.mock.calls[mock.mock.calls.length - 1][0];

describe("<FlowEditor>", () => {
  beforeEach(registerTestBits);

  it("does not report an edit merely for loading a flow", () => {
    const { onEdit } = setup();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("offers every registered bit in the palette", () => {
    setup();
    for (const name of ["Start", "Content", "Task", "End"]) {
      expect(screen.getByRole("button", { name })).toBeDefined();
    }
  });

  it("adds a step and connects it to the previous one", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();

    await user.click(screen.getByRole("button", { name: "Content" }));

    const updated = lastDoc(onEdit);
    expect(updated.nodes).toHaveLength(4);
    // Chained onto the last node so the flow stays connected.
    expect(updated.edges.some((e) => e.target === updated.nodes[3].id)).toBe(true);
  });

  it("edits the flow's own settings", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();

    await user.type(screen.getByLabelText("Title of the assessment"), "!");

    expect(lastDoc(onEdit).meta.title).toBe("Test flow!");
  });

  it("turns on confidence for the whole flow", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();

    await user.click(screen.getByLabelText(/Ask how sure the learner is/));

    expect(lastDoc(onEdit).meta.askConfidence).toBe(true);
  });

  it("reports validation problems", () => {
    const broken = doc(
      [node("a", "test-task", { prompt: "x", correct: "y" })],
      [],
    );
    setup({ flow: broken });
    // A task with nowhere to go is a dead end.
    expect(screen.getByText(/problem/)).toBeDefined();
  });

  it("says so when there is nothing to fix", () => {
    setup();
    expect(screen.getByText("No problems found.")).toBeDefined();
  });

  it("reports an unparseable flow through onError", () => {
    const { onError } = setup({ flow: "{not json" });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].code).toBe("INVALID_FLOW");
  });

  describe("preview", () => {
    it("runs the real learner component", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole("button", { name: "Preview" }));

      // "Welcome" comes from the start bit rendered by <Flow>, not from a
      // separate preview renderer.
      expect(screen.getByText("Welcome")).toBeDefined();
      expect(screen.getByText("This is exactly what the learner sees.")).toBeDefined();
    });

    it("goes back to the canvas", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Preview" }));
      await user.click(screen.getByRole("button", { name: "Stop preview" }));

      expect(screen.queryByText("This is exactly what the learner sees.")).toBeNull();
    });
  });

  describe("imperative handle", () => {
    it("returns the current document", async () => {
      const user = userEvent.setup();
      const { ref } = setup();
      await user.type(screen.getByLabelText("Title of the assessment"), "!");

      expect(ref.current?.getFlow().meta.title).toBe("Test flow!");
    });

    it("validates on demand", () => {
      const { ref } = setup();
      expect(ref.current?.validate()).toEqual({ valid: true, diagnostics: [] });
    });

    it("saves the document through onSave", () => {
      const { ref, onSave } = setup();
      ref.current?.save();
      expect(onSave).toHaveBeenCalledOnce();
    });

    it("undoes and redoes an edit", async () => {
      const user = userEvent.setup();
      const { ref } = setup();

      await user.click(screen.getByRole("button", { name: "Content" }));
      expect(ref.current?.getFlow().nodes).toHaveLength(4);

      ref.current?.undo();
      expect(ref.current?.getFlow().nodes).toHaveLength(3);

      ref.current?.redo();
      expect(ref.current?.getFlow().nodes).toHaveLength(4);
    });
  });

  describe("readonly", () => {
    it("hides the palette and the save action", () => {
      setup({ readonly: true });
      expect(screen.queryByRole("button", { name: "Task" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
      // Preview still works: looking is not editing.
      expect(screen.getByRole("button", { name: "Preview" })).toBeDefined();
    });
  });

  it("keeps two editors on one page independent", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();

    render(
      <>
        <FlowEditor flow={simpleFlow} locale="en" onEdit={first} />
        <FlowEditor flow={simpleFlow} locale="en" onEdit={second} />
      </>,
    );

    await user.click(screen.getAllByRole("button", { name: "Content" })[0]);

    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });
});

describe("editor store", () => {
  beforeEach(registerTestBits);

  it("drops edges that pointed at a deleted step", async () => {
    const { ref } = setup({
      flow: doc(
        [
          node("start", "test-start", { title: "a" }),
          node("mid", "test-content", { text: "b" }),
          node("end", "test-end"),
        ],
        [edge("start", "mid"), edge("mid", "end")],
      ),
    });

    const store = ref.current;
    expect(store?.getFlow().edges).toHaveLength(2);
  });
});
