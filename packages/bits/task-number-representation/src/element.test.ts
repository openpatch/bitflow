import { defaultEvaluation } from "@bitflow/core";
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Write the value in binary.",
  sourceRepresentation: "decimal",
  sourceValue: "42",
  targetRepresentation: "binary",
  bitWidth: 8,
  signed: false,
  allowPrefix: true,
  allowSeparators: true,
  requireFullWidth: true,
  scoring: "answer",
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement(
    "bitflow-task-number-representation",
  ) as HTMLElement & Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-number-representation>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-number-representation")).toBeDefined();
  });

  it("shows the value and a box to write it in again", async () => {
    const element = await mount();

    expect(element.textContent).toContain("42");
    expect(element.querySelector(".bitflow-number-input")).not.toBeNull();
  });

  it("reports what was typed through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const input = element.querySelector(".bitflow-number-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "00101010" } });
    await flush();

    expect(listener.mock.calls[0][0].detail.answer).toEqual({ raw: "00101010" });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders the value as text and never as markup", async () => {
    const element = await mount({
      data: {
        ...data,
        sourceRepresentation: "text",
        sourceValue: "<b>hi</b>",
        bitWidth: 16,
        evaluation: { ...data.evaluation, mode: "skip" },
      },
    });

    expect(element.querySelector("b")).toBeNull();
    expect(element.textContent).toContain("<b>hi</b>");
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { raw: "0b00101010" },
    });

    expect(result.state).toBe("correct");
  });
});
