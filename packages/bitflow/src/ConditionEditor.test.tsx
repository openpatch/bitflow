import type { BitflowDocument, Condition } from "@bitflow/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConditionEditor } from "./ConditionEditor";
import { doc, edge, node, registerTestBits } from "./test-utils";

/**
 * The teacher-facing side of branching. A teacher must be able to build these
 * conditions through the form, without writing JSON — so this drives the form.
 */
const flow: BitflowDocument = doc(
  [
    node("q1", "test-task", { prompt: "Capital of France?", correct: "Paris" }),
    node("q2", "test-task", { prompt: "Capital of Italy?", correct: "Rome" }),
    node("easy", "test-content", { text: "easier" }),
  ],
  [edge("q1", "q2"), edge("q2", "easy")],
);

/**
 * The editor is controlled, so the harness feeds each change back the way the
 * real sidebar does — otherwise the follow-up fields never appear.
 */
const setup = (initial?: Condition) => {
  const onChange = vi.fn();

  const Harness = () => {
    const [condition, setCondition] = useState<Condition | undefined>(initial);
    return (
      <ConditionEditor
        doc={flow}
        condition={condition}
        locale="en"
        onChange={(next) => {
          onChange(next);
          setCondition(next);
        }}
      />
    );
  };

  render(<Harness />);
  return { onChange };
};

const lastCondition = (onChange: ReturnType<typeof vi.fn>): Condition =>
  onChange.mock.calls[onChange.mock.calls.length - 1][0];

describe("<ConditionEditor>", () => {
  beforeEach(registerTestBits);

  it("follows the connection always, until told otherwise", () => {
    setup();
    expect(
      (screen.getByLabelText(/Only follow this connection/) as HTMLSelectElement).value,
    ).toBe("always");
  });

  describe("counting correct answers", () => {
    it("is offered as a kind of condition", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(
        screen.getByLabelText(/Only follow this connection/),
        "count",
      );

      // A sensible starting point rather than an empty form.
      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "resultCount", state: "correct" },
        op: "gte",
        right: 1,
      });
    });

    it("sets how many are needed", async () => {
      const user = userEvent.setup();
      const { onChange } = setup({
        type: "compare",
        left: { kind: "resultCount", state: "correct" },
        op: "gte",
        right: 1,
      });

      const howMany = screen.getByLabelText("How many tasks");
      await user.clear(howMany);
      await user.type(howMany, "3");

      expect(lastCondition(onChange)).toMatchObject({
        left: { kind: "resultCount", state: "correct" },
        op: "gte",
        right: 3,
      });
    });

    it("changes at least to at most without losing the count", async () => {
      const user = userEvent.setup();
      const { onChange } = setup({
        type: "compare",
        left: { kind: "resultCount", state: "correct" },
        op: "gte",
        right: 3,
      });

      await user.selectOptions(screen.getByLabelText("How to compare"), "lte");

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "resultCount", state: "correct" },
        op: "lte",
        right: 3,
      });
    });

    it("can count a different outcome", async () => {
      const user = userEvent.setup();
      const { onChange } = setup({
        type: "compare",
        left: { kind: "resultCount", state: "correct" },
        op: "gte",
        right: 2,
      });

      await user.selectOptions(screen.getByLabelText("Outcome"), "wrong");

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "resultCount", state: "wrong" },
        op: "gte",
        right: 2,
      });
    });

    it("shows the count it was given rather than a default", () => {
      setup({
        type: "compare",
        left: { kind: "resultCount", state: "wrong" },
        op: "eq",
        right: 4,
      });

      expect((screen.getByLabelText("How many tasks") as HTMLInputElement).value).toBe("4");
      expect((screen.getByLabelText("How to compare") as HTMLSelectElement).value).toBe("eq");
      expect((screen.getByLabelText("Outcome") as HTMLSelectElement).value).toBe("wrong");
    });

    it("does not ask which task, because it counts all of them", async () => {
      const user = userEvent.setup();
      setup();
      await user.selectOptions(
        screen.getByLabelText(/Only follow this connection/),
        "count",
      );
      expect(screen.queryByLabelText("Task")).toBeNull();
    });
  });

  describe("a single task's outcome", () => {
    it("still works, and asks which task", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(
        screen.getByLabelText(/Only follow this connection/),
        "result",
      );

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "result", nodeId: "q1", path: "state" },
        op: "eq",
        right: "correct",
      });
      expect(screen.getByLabelText("Task")).toBeDefined();
    });
  });

  it("shows a condition it cannot express read-only, rather than rewriting it", () => {
    setup({
      type: "or",
      conditions: [
        { type: "compare", left: { kind: "score" }, op: "gt", right: 2 },
        { type: "always" },
      ],
    });

    expect(screen.getByText(/"scoreRatio"|"score"/)).toBeDefined();
    expect(screen.queryByLabelText("How many tasks")).toBeNull();
  });
});
