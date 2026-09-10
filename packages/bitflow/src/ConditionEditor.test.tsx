import type { BitflowDocument, Condition } from "@bitflow/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConditionEditor, summariseCondition } from "./ConditionEditor";
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

  describe("the rules added after the first two", () => {
    const ruleKindPicker = () =>
      within(rules()[0]).getByLabelText("This rule is about");

    it("builds a yes/no answer rule with no dot path in sight", async () => {
      // The branch a consent step needs. Written as an object with a path it
      // could not be built here at all, which is why the answer is a bare
      // boolean.
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");
      await user.selectOptions(ruleKindPicker(), "answer");
      await user.selectOptions(
        within(rules()[0]).getByLabelText("Their answer is"),
        "no",
      );

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "answer", nodeId: "q1" },
        op: "eq",
        right: false,
      });
    });

    it("reads a yes/no answer rule back into the form", () => {
      setup({
        type: "compare",
        left: { kind: "answer", nodeId: "q2" },
        op: "eq",
        right: false,
      });
      expect((ruleKindPicker() as HTMLSelectElement).value).toBe("answer");
      expect(
        (within(rules()[0]).getByLabelText("Their answer is") as HTMLSelectElement)
          .value,
      ).toBe("no");
    });

    it("leaves an answer buried at a path to the file", () => {
      // Shown read-only rather than rewritten: there is no jargon-free way to
      // offer a dot path, and mangling it would be worse than not showing it.
      setup({
        type: "compare",
        left: { kind: "answer", nodeId: "q1", path: "choices.0" },
        op: "eq",
        right: true,
      });
      expect(screen.getByText(/rule the form cannot show/)).toBeDefined();
    });

    it("builds a confidence rule on the five-point scale, not on fractions", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");
      await user.selectOptions(ruleKindPicker(), "confidence");
      await user.selectOptions(
        within(rules()[0]).getByLabelText("How sure"),
        "1",
      );

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "confidence", nodeId: "q1" },
        op: "gte",
        right: 1,
      });
    });

    it("builds a share-of-the-marks rule, in percent", async () => {
      // The branch a section-pass needs, and the last one that could only be
      // written by hand in the file.
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");
      await user.selectOptions(ruleKindPicker(), "score");

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "scoreRatio" },
        op: "gte",
        right: 0.8,
      });

      const percent = within(rules()[0]).getByLabelText("Percent");
      expect((percent as HTMLInputElement).value).toBe("80");
    });

    it("reads a share rule back without turning it into a fraction on screen", () => {
      setup({
        type: "compare",
        left: { kind: "scoreRatio" },
        op: "gte",
        right: 0.5,
      });
      expect(
        (within(rules()[0]).getByLabelText("Percent") as HTMLInputElement).value,
      ).toBe("50");
    });

    it("keeps points and shares apart", async () => {
      const user = userEvent.setup();
      const { onChange } = setup({
        type: "compare",
        left: { kind: "scoreRatio" },
        op: "gte",
        right: 0.8,
      });

      await user.selectOptions(
        within(rules()[0]).getByLabelText("Measured as"),
        "points",
      );

      // 0.8 points is not what "80%" meant, so the value does not travel.
      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "score" },
        op: "gte",
        right: 5,
      });
    });

    it("builds a clock rule in seconds", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");
      await user.selectOptions(ruleKindPicker(), "time");

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: { kind: "timeRemaining" },
        op: "lte",
        right: 60,
      });
    });

    it("counts over the last few tasks when asked", async () => {
      const user = userEvent.setup();
      const { onChange } = setup();

      await user.selectOptions(kindPicker(), "rules");
      await user.selectOptions(
        within(rules()[0]).getByLabelText("Counted over"),
        "last",
      );

      expect(lastCondition(onChange)).toEqual({
        type: "compare",
        left: {
          kind: "resultCount",
          state: "correct",
          scope: { kind: "last", count: 3 },
        },
        op: "gte",
        right: 1,
      });
    });

    it("offers no section scope when the flow declares none", async () => {
      // A picker with nothing in it would store a scope that counts nothing.
      const user = userEvent.setup();
      setup();
      await user.selectOptions(kindPicker(), "rules");

      const scope = within(rules()[0]).getByLabelText("Counted over");
      expect(
        [...(scope as HTMLSelectElement).options].map((option) => option.value),
      ).toEqual(["all", "last"]);
    });

    it("keeps the step it was pointed at when the rule changes kind", async () => {
      // Changing your mind about half a rule must not throw away the other half.
      const user = userEvent.setup();
      const { onChange } = setup({
        type: "compare",
        left: { kind: "result", nodeId: "q2", path: "state" },
        op: "eq",
        right: "wrong",
      });

      await user.selectOptions(ruleKindPicker(), "confidence");
      expect(lastCondition(onChange)).toMatchObject({
        left: { kind: "confidence", nodeId: "q2" },
      });
    });
  });

  describe("what a connection says on the canvas", () => {
    const summarise = (condition: Condition | undefined) =>
      summariseCondition(flow, condition, "en");

    it("says nothing for a connection that is always followed", () => {
      expect(summarise(undefined)).toBeUndefined();
    });

    it("names the outcome it branches on", () => {
      expect(
        summarise({
          type: "compare",
          left: { kind: "result", nodeId: "q1", path: "state" },
          op: "eq",
          right: "wrong",
        }),
      ).toBe("wrong");
    });

    it("says which way a yes/no answer went", () => {
      expect(
        summarise({
          type: "compare",
          left: { kind: "answer", nodeId: "q1" },
          op: "eq",
          right: false,
        }),
      ).toBe("answered No");
    });

    it("writes a count with the symbol rather than a word", () => {
      expect(
        summarise({
          type: "compare",
          left: { kind: "resultCount", state: "correct" },
          op: "gte",
          right: 3,
        }),
      ).toBe("≥ 3 correct");
    });

    it("says what a count was taken over", () => {
      expect(
        summarise({
          type: "compare",
          left: {
            kind: "resultCount",
            state: "correct",
            scope: { kind: "last", count: 3 },
          },
          op: "gte",
          right: 2,
        }),
      ).toBe("≥ 2 correct of last 3");
    });

    it("shows confidence on the scale the learner saw, not as a fraction", () => {
      expect(
        summarise({
          type: "compare",
          left: { kind: "confidence", nodeId: "q1" },
          op: "gte",
          right: 0.8,
        }),
      ).toBe("sure ≥ 4");
    });

    it("joins several rules the way they are combined", () => {
      expect(
        summarise({
          type: "and",
          conditions: [
            {
              type: "compare",
              left: { kind: "result", nodeId: "q1", path: "state" },
              op: "eq",
              right: "wrong",
            },
            {
              type: "compare",
              left: { kind: "confidence", nodeId: "q1" },
              op: "gte",
              right: 0.8,
            },
          ],
        }),
      ).toBe("wrong and sure ≥ 4");
    });

    it("writes a share of the marks as a percentage", () => {
      // Which is how the section-pass branch reads: "≥ 100% in Reading".
      expect(
        summarise({
          type: "compare",
          left: {
            kind: "scoreRatio",
            scope: { kind: "section", id: "reading" },
          },
          op: "gte",
          right: 0.8,
        }),
      ).toBe("≥ 80% in reading");
    });

    it("admits it cannot describe a rule the form cannot show", () => {
      // Better than "?", which said a rule was there and nothing else.
      expect(
        summarise({
          type: "compare",
          left: { kind: "answer", nodeId: "q1", path: "choices.0" },
          op: "eq",
          right: true,
        }),
      ).toBe("a rule you cannot see from here");
    });

    it("cuts a long rule set rather than letting it cover the canvas", () => {
      const summary = summarise({
        type: "and",
        conditions: Array.from({ length: 6 }, () => ({
          type: "compare" as const,
          left: { kind: "resultCount" as const, state: "correct" as const },
          op: "gte" as const,
          right: 3,
        })),
      });
      expect(summary!.length).toBeLessThanOrEqual(40);
      expect(summary!.endsWith("…")).toBe(true);
    });
  });
});
