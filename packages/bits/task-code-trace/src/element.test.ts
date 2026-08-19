import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Trace the loop.",
  language: "JavaScript",
  code: "let total = 0;\nfor (const v of [1, 2, 3]) total += v;\nprint(total);",
  showLineNumbers: true,
  columns: [
    { id: "total", name: "total", kind: "value" },
    { id: "out", name: "printed", kind: "output" },
  ],
  checkpoints: [
    { id: "before", label: "before the loop", line: 1, expected: { total: "0", out: "" } },
    { id: "after", label: "after the loop", line: 3, expected: { total: "6", out: "6" } },
  ],
  caseSensitive: false,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-code-trace") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-code-trace>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-code-trace")).toBeDefined();
  });

  it("draws the program and a cell per column and checkpoint", async () => {
    const element = await mount();

    expect(element.querySelectorAll(".bitflow-trace-line")).toHaveLength(3);
    expect(element.querySelectorAll(".bitflow-trace-cell")).toHaveLength(4);
  });

  it("never executes the code it shows", async () => {
    const element = await mount({
      data: { ...data, code: "window.ran = true;\nprint(1);\nprint(2);" },
    });

    // The listing is text. Nothing here reaches `eval`, `Function` or a runner
    // anywhere else, and this is the test that says so.
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
    expect(element.textContent).toContain("window.ran = true;");
  });

  it("reports a filled cell through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const input = element.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0" } });
    await flush();

    expect(listener.mock.calls[0][0].detail.answer).toEqual({
      cells: { before: { total: "0" } },
    });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: {
        cells: { before: { total: "0", out: "" }, after: { total: "6", out: "6" } },
      },
    });

    expect(result.state).toBe("correct");
  });
});
