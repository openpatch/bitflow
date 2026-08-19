import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "How far does light travel in one second, in metres?",
  expected: "2.998e8",
  tolerance: "percent",
  toleranceValue: 1,
  digits: 2,
  unitMode: "shown",
  unit: "m",
  unitAlternatives: [],
  scoring: "value",
  decimalSeparator: "both",
  allowExpression: true,
  valueFeedback: [],
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-numeric") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-numeric>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-numeric")).toBeDefined();
  });

  it("renders a labelled box with the unit beside it", async () => {
    const element = await mount();

    expect(element.querySelector(".bitflow-numeric-input")).not.toBeNull();
    expect(element.querySelector(".bitflow-numeric-unit")?.textContent).toBe("m");
  });

  it("reports what was typed through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const input = element.querySelector(".bitflow-numeric-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "3e8" } });
    await flush();

    // The raw text, and only the raw text: what it comes to is derived, and
    // derived is where it stays.
    expect(listener.mock.calls[0][0].detail.answer).toEqual({ input: "3e8" });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("never puts the expected answer into the page", async () => {
    const element = await mount();

    // It is in the data the page was handed, unavoidably. It must not be in
    // the DOM, where reading the answer is a right-click away.
    expect(element.innerHTML).not.toContain("2.998e8");
    expect(element.innerHTML).not.toContain("299800000");
  });

  it("renders the instruction as text and never as markup", async () => {
    const element = await mount({
      data: { ...data, instruction: "<script>window.ran = true</script>" },
    });

    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { input: "3e8" },
    });

    expect(result.state).toBe("correct");
  });

  it("refuses to save an expected value it cannot work out", async () => {
    const { DataSchema } = await import("./schema");
    const result = DataSchema.safeParse({ ...data, expected: "((((" });

    expect(result.success).toBe(false);
  });

  it("still marks rather than throws when such data reaches it anyway", async () => {
    // The schema above is the gate, but it is not the only way in: a flow can
    // be rendered with a node that failed validation, and an exception here
    // would take the whole run down over one bad question.
    const { evaluate } = await import("./evaluate");

    const result = evaluate({
      data: { ...data, expected: "((((" } as never,
      answer: { input: "3e8" },
    });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });
});
