import type { BitflowDocument, Condition } from "@bitflow/core";
import { render, screen, within } from "@testing-library/react";
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

const rules = () => screen.getAllByRole("listitem");
const kindPicker = () => screen.getByLabelText(/Only follow this connection/);

describe("<ConditionEditor>", () => {
  beforeEach(registerTestBits);

  it("follows the connection always, until told otherwise", () => {
    setup();
    expect((kindPicker() as HTMLSelectElement).value).toBe("always");
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("starts with one rule that can actually fire", async () => {
    const user = userEvent.setup();
    const { onChange } = setup();

    await user.selectOptions(kindPicker(), "rules");

    expect(lastCondition(onChange)).toEqual({
      type: "compare",
      left: { kind: "resultCount", state: "correct" },
      op: "gte",
      right: 1,
    });
    expect(rules()).toHaveLength(1);
  });

  it("goes back to always", async () => {
    const user = userEvent.setup();
    const { onChange } = setup({
      type: "compare",
      left: { kind: "resultCount", state: "correct" },
      op: "gte",
      right: 1,
    });

    await user.selectOptions(kindPicker(), "always");

    expect(lastCondition(onChange)).toBeUndefined();
  });

  describe("one rule", () => {
    const countRule: Condition = {
      type: "compare",
      left: { kind: "resultCount", state: "correct" },
      op: "gte",
      right: 1,
    };

    it("stays a bare comparison, so simple documents stay simple", async () => {
      const user = userEvent.setup();
      const { onChange } = setup(countRule);

      await user.clear(screen.getByLabelText("How many tasks"));
      await user.type(screen.getByLabelText("How many tasks"), "3");

      expect(lastCondition(onChange)).toMatchObject({ type: "compare", right: 3 });
    });

    it("hides the all-of/any-of choice, which would mean nothing", () => {
      setup(countRule);
      expect(screen.queryByLabelText("Which rules have to hold")).toBeNull();
    });

    it("cannot be removed, since a rule set needs at least one", () => {
      setup(countRule);
      expect(
        (screen.getByRole("button", { name: "Remove this rule" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it("switches between counting and one task's outcome", async () => {
      const user = userEvent.setup();
      const { onChange } = setup(countRule);

      await user.selectOptions(screen.getByLabelText("This rule is about"), "result");

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "result", nodeId: "q1", path: "state" },
        op: "eq",
        right: "correct",
      });
      expect(screen.getByLabelText("Task")).toBeDefined();
    });
  });

  describe("several rules", () => {
    /**
     * The case this exists for: "at least eight correct, but question 1 wrong."
     * Two rules, joined by all-of.
     */
    it("builds a rule set a teacher would actually write", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");

      // Rule one: at least two correct.
      await user.clear(screen.getByLabelText("How many tasks"));
      await user.type(screen.getByLabelText("How many tasks"), "2");

      // Rule two: but question 1 was wrong.
      await user.click(screen.getByRole("button", { name: "Add a rule" }));
      const second = rules()[1];
      await user.selectOptions(
        within(second).getByLabelText("This rule is about"),
        "result",
      );
      await user.selectOptions(within(second).getByLabelText("Outcome"), "wrong");

      expect(lastCondition(onChange)).toEqual({
        type: "and",
        conditions: [
          {
            type: "compare",
            left: { kind: "resultCount", state: "correct" },
            op: "gte",
            right: 2,
          },
          {
            type: "compare",
            left: { kind: "result", nodeId: "q1", path: "state" },
            op: "eq",
            right: "wrong",
          },
        ],
      });
    });

    it("offers all-of and any-of once there is something to combine", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();
      await user.selectOptions(kindPicker(), "rules");
      await user.click(screen.getByRole("button", { name: "Add a rule" }));

      await user.selectOptions(
        screen.getByLabelText("Which rules have to hold"),
        "or",
      );

      expect(lastCondition(onChange)).toMatchObject({ type: "or" });
    });

    it("removes a rule", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();
      await user.selectOptions(kindPicker(), "rules");
      await user.click(screen.getByRole("button", { name: "Add a rule" }));
      expect(rules()).toHaveLength(2);

      await user.click(
        screen.getAllByRole("button", { name: "Remove this rule" })[1],
      );

      expect(rules()).toHaveLength(1);
      // Back to a bare comparison rather than a one-element and.
      expect(lastCondition(onChange)).toMatchObject({ type: "compare" });
    });

    it("reopens a saved rule set with every rule in place", () => {
      setup({
        type: "and",
        conditions: [
          {
            type: "compare",
            left: { kind: "resultCount", state: "correct" },
            op: "gte",
            right: 8,
          },
          {
            type: "compare",
            left: { kind: "result", nodeId: "q1", path: "state" },
            op: "eq",
            right: "wrong",
          },
        ],
      });

      expect(rules()).toHaveLength(2);
      expect(
        (screen.getByLabelText("How many tasks") as HTMLInputElement).value,
      ).toBe("8");
      expect(
        (screen.getByLabelText("Which rules have to hold") as HTMLSelectElement).value,
      ).toBe("and");
    });
  });

  it("no longer offers waiting for a teacher as an outcome", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(kindPicker(), "rules");

    const outcomes = [...(screen.getByLabelText("Outcome") as HTMLSelectElement).options].map(
      (option) => option.value,
    );
    expect(outcomes).toEqual(["correct", "wrong", "unknown"]);
  });

  it("shows a condition it cannot express read-only, rather than rewriting it", () => {
    setup({
      type: "or",
      conditions: [
        { type: "compare", left: { kind: "score" }, op: "gt", right: 2 },
        { type: "always" },
      ],
    });

    expect(screen.getByText(/cannot show/)).toBeDefined();
    expect(screen.queryByLabelText("How many tasks")).toBeNull();
  });
});
