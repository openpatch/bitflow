import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Do one pass of bubble sort.",
  initial: ["5", "2", "8"],
  steps: [{ id: "p1", label: "After pass 1", expected: ["2", "5", "8"] }],
  mode: "rearrange",
  showIndices: true,
  caseSensitive: false,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-array-steps") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-array-steps>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-array-steps")).toBeDefined();
  });

  it("draws the starting array and a box per value in each step", async () => {
    const element = await mount();
    expect(element.querySelectorAll(".bitflow-array-cell-fixed")).toHaveLength(3);
    expect(element.querySelectorAll(".bitflow-array-cell-button")).toHaveLength(3);
  });

  it("reports the answer as the learner swaps", async () => {
    const element = await mount();
    const changes: unknown[] = [];
    const listener = (event: Event) =>
      changes.push((event as CustomEvent).detail.answer);
    document.addEventListener("bitflow-answerchange", listener);
    const [five, two] = element.querySelectorAll<HTMLButtonElement>(
      ".bitflow-array-cell-button",
    );
    fireEvent.click(five);
    // The element renders outside act(), so the pick-up has to land before
    // the second tap can swap with it.
    await flush();
    fireEvent.click(two);
    await flush();

    expect(changes.at(-1)).toEqual({ rows: [["2", "5", "8"]] });
    document.removeEventListener("bitflow-answerchange", listener);
  });
});
