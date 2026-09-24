import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Write down the stack.",
  language: "Java",
  code: "int fak(int n) {\n  if (n <= 1) return 1;\n  return n * fak(n - 1);\n}",
  showLineNumbers: true,
  showLocals: false,
  checkpoints: [
    { id: "m1", label: "fak(1) is called", line: 2, expected: [{ call: "fak(1)", locals: "" }, { call: "fak(2)", locals: "" }] },
  ],
  caseSensitive: false,
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-call-stack>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-call-stack")).toBeDefined();
  });

  it("shows the program and an empty stack to build", async () => {
    const element = document.createElement("bitflow-task-call-stack") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelectorAll(".bitflow-callstack-line")).toHaveLength(4);
    expect(element.textContent).toContain("The stack is empty.");
  });

  it("never runs the code it shows", async () => {
    const element = document.createElement("bitflow-task-call-stack") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data: { ...data, code: "window.ran = true;" }, locale: "en" });
    document.body.append(element);
    await flush();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
  });
});
