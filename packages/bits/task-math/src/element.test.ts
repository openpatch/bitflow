import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Differentiate $x^2$ with respect to $x$.",
  latex: "",
  blanks: { answer: { expected: "2x", accepted: [] } },
  compare: "symbolic",
  tolerance: 0,
  partialCredit: true,
  virtualKeyboard: true,
  blankFeedback: [],
  evaluation: defaultEvaluation(),
};

const flush = async (times = 8) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-math") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-math>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-math")).toBeDefined();
  });

  it("degrades to a labelled LaTeX box where MathLive cannot load", async () => {
    // Which is what jsdom is. The point is not the test environment: a chunk
    // that does not arrive looks exactly the same to the learner, and a task
    // that renders nothing at all in that case is a lost mark.
    const element = await mount();

    const box = element.querySelector("input[type=text]") as HTMLInputElement;
    expect(box).not.toBeNull();
    const label = element.querySelector(`label[for="${box.id}"]`);
    expect(label?.textContent).toBe("Your answer, as LaTeX");
  });

  it("reports what was typed through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    const box = element.querySelector("input[type=text]") as HTMLInputElement;
    // Through the native setter, because React tracks the value itself and
    // ignores an `input` event whose value it believes it already has.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      box,
      "2x",
    );
    box.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();

    expect(listener.mock.calls[0][0].detail.answer).toEqual({
      prompts: { answer: "2x" },
    });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("never puts the expected answer into the page", async () => {
    const element = await mount({
      data: { ...data, blanks: { answer: { expected: "\\sqrt{171}", accepted: [] } } },
    });

    // It is in the data the page was handed, unavoidably. It must not be in
    // the DOM, where reading the answer is a right-click away.
    expect(element.innerHTML).not.toContain("171");
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

    const result = await evaluate({
      data: DataSchema.parse(data),
      answer: { prompts: { answer: "x\\cdot 2" } },
    });

    expect(result.state).toBe("correct");
  });
});
