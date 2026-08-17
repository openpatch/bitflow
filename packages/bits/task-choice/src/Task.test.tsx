import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataSchema, type Answer, type Data } from "./schema";
import { Task } from "./Task";

const data = (overrides: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "Which are prime?",
    variant: "multiple",
    choices: [
      { id: "a", markdown: "2", correct: true },
      { id: "b", markdown: "3", correct: true },
      { id: "c", markdown: "4", correct: false },
    ],
    ...overrides,
  });

const renderTask = (props: Partial<Parameters<typeof Task>[0]> = {}) => {
  const onAnswerChange = vi.fn();
  const utils = render(
    <Task
      data={data()}
      locale="en"
      onAnswerChange={onAnswerChange}
      {...props}
    />,
  );
  return { onAnswerChange, ...utils };
};

describe("Task", () => {
  it("renders the instruction as Markdown", () => {
    renderTask({ data: data({ instruction: "Which are **prime**?" }) });
    expect(screen.getByText("prime").tagName).toBe("STRONG");
  });

  it("renders checkboxes for a multiple-choice task", () => {
    renderTask();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("renders radios for a single-choice task", () => {
    renderTask({
      data: data({
        variant: "single",
        choices: [
          { id: "a", markdown: "2", correct: true },
          { id: "b", markdown: "3", correct: false },
        ],
      }),
    });
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("reports each selection as it is made", async () => {
    const user = userEvent.setup();
    const { onAnswerChange } = renderTask();

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(onAnswerChange).toHaveBeenLastCalledWith({ selected: ["a"] });
  });

  it("adds to the selection in a multiple-choice task", async () => {
    const user = userEvent.setup();
    const answer: Answer = { selected: ["a"] };
    const { onAnswerChange } = renderTask({ answer });

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(onAnswerChange).toHaveBeenLastCalledWith({ selected: ["a", "b"] });
  });

  it("removes from the selection when a ticked choice is clicked again", async () => {
    const user = userEvent.setup();
    const { onAnswerChange } = renderTask({ answer: { selected: ["a", "b"] } });

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(onAnswerChange).toHaveBeenLastCalledWith({ selected: ["b"] });
  });

  it("replaces the selection in a single-choice task", async () => {
    const user = userEvent.setup();
    const { onAnswerChange } = renderTask({
      data: data({
        variant: "single",
        choices: [
          { id: "a", markdown: "2", correct: true },
          { id: "b", markdown: "3", correct: false },
        ],
      }),
      answer: { selected: ["a"] },
    });

    await user.click(screen.getAllByRole("radio")[1]);
    expect(onAnswerChange).toHaveBeenLastCalledWith({ selected: ["b"] });
  });

  it("can be completed with the keyboard alone", async () => {
    const user = userEvent.setup();
    const { onAnswerChange } = renderTask();

    await user.tab();
    expect(document.activeElement).toBe(screen.getAllByRole("checkbox")[0]);
    await user.keyboard(" ");
    expect(onAnswerChange).toHaveBeenLastCalledWith({ selected: ["a"] });
  });

  it("accepts no input once it is read-only", async () => {
    const user = userEvent.setup();
    const { onAnswerChange } = renderTask({ readonly: true });

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it("names each choice's outcome in text, not only colour", () => {
    renderTask({
      answer: { selected: ["a", "c"] },
      result: {
        state: "wrong",
        detail: { choices: { a: "correct", b: "wrong", c: "wrong" } },
      },
      readonly: true,
    });
    expect(screen.getAllByText("correct")).toHaveLength(1);
    expect(screen.getAllByText("wrong")).toHaveLength(2);
  });

  it("groups the choices under an accessible legend", () => {
    renderTask();
    expect(
      screen.getByRole("group", { name: "Choose all answers that apply" }),
    ).toBeDefined();
  });

  it("keeps every choice when shuffling", () => {
    renderTask({ data: data({ shuffle: true }) });
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
});
