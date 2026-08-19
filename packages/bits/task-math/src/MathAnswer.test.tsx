import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MathAnswer } from "./MathAnswer";
import { resetMathfield } from "./mathfield";
import { DataSchema, type Answer, type Data } from "./schema";

/**
 * MathLive is mocked at the module boundary rather than driven for real.
 *
 * It cannot be mounted under jsdom at all — its `node` export has no
 * `MathfieldElement` in it, and `connectedCallback` reaches for
 * `ResizeObserver` and a virtual-keyboard singleton that are not there. Faking
 * those would be testing a fake MathLive.
 *
 * What is worth testing is this package's half of the contract: that prompts
 * are read and written by name, that the marked state reaches each blank, and
 * that a caret is not thrown to the end of the line on every keystroke. So the
 * mock is the API surface `mathfield.ts` declares, and nothing else.
 */
const promptValues = new Map<string, string>();
const promptStates = new Map<string, string>();
let mounted = 0;

class FakeMathfield extends HTMLElement {
  value = "";
  readOnly = false;
  mathVirtualKeyboardPolicy: "auto" | "manual" | "sandboxed" = "auto";

  constructor() {
    super();
    mounted += 1;
  }

  getPrompts() {
    return [...promptValues.keys()];
  }
  getPromptValue(name: string) {
    return promptValues.get(name) ?? "";
  }
  setPromptValue(name: string, value: string) {
    promptValues.set(name, value);
  }
  setPromptState(name: string, state: string, locked?: boolean) {
    promptStates.set(name, `${state}${locked ? ":locked" : ""}`);
  }

  /** Stands in for somebody typing: sets a value and fires `input`. */
  simulate(name: string | undefined, value: string) {
    if (name === undefined) this.value = value;
    else promptValues.set(name, value);
    this.dispatchEvent(new Event("input", { bubbles: false }));
  }
}

customElements.define("fake-math-field", FakeMathfield);

vi.mock("./mathfield", async () => {
  const actual = await vi.importActual<typeof import("./mathfield")>("./mathfield");
  return {
    ...actual,
    loadMathfield: vi.fn(async () => ({ MathfieldElement: FakeMathfield })),
  };
});

const make = (changes: Partial<Data> = {}): Data =>
  DataSchema.parse({
    latex: "",
    blanks: { answer: { expected: "2x", accepted: [] } },
    ...changes,
  });

const Live = ({ data, ...rest }: { data: Data } & Record<string, unknown>) => {
  const [answer, setAnswer] = useState<Answer>({ prompts: {} });
  return (
    <MathAnswer
      data={data}
      answer={answer}
      locale="en"
      onChange={setAnswer}
      {...rest}
    />
  );
};

const fieldIn = (container: HTMLElement) =>
  container.querySelector("fake-math-field") as unknown as FakeMathfield;

beforeEach(() => {
  promptValues.clear();
  promptStates.clear();
  mounted = 0;
  resetMathfield();
});

afterEach(() => vi.clearAllMocks());

describe("a formula with no blanks", () => {
  it("gives one editable field, labelled", async () => {
    const { container } = render(<Live data={make()} />);
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    expect(screen.getByText("Your answer")).toBeDefined();
    expect(fieldIn(container).getAttribute("aria-label")).toBe("Your answer");
  });

  it("reports the whole field under the single reserved name", async () => {
    const changed = vi.fn();
    const { container } = render(
      <MathAnswer
        data={make()}
        answer={{ prompts: {} }}
        locale="en"
        onChange={changed}
      />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    fieldIn(container).simulate(undefined, "2x");
    expect(changed).toHaveBeenCalledWith({ prompts: { answer: "2x" } });
  });
});

describe("a formula with blanks", () => {
  const data = make({
    latex: "x=\\placeholder[a]{}+\\placeholder[b]{}",
    blanks: { a: { expected: "2", accepted: [] }, b: { expected: "3", accepted: [] } },
  });

  it("makes the formula read-only and the gaps the answer", async () => {
    const { container } = render(<Live data={data} />);
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    const field = fieldIn(container);
    expect(field.readOnly).toBe(true);
    expect(field.value).toBe(data.latex);
  });

  it("reports every blank by name when one of them changes", async () => {
    const changed = vi.fn();
    const { container } = render(
      <MathAnswer
        data={data}
        answer={{ prompts: {} }}
        locale="en"
        onChange={changed}
      />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    fieldIn(container).simulate("a", "2");
    expect(changed).toHaveBeenCalledWith({ prompts: { a: "2", b: "" } });
  });

  it("marks each blank where it stands once checked", async () => {
    const { container } = render(
      <MathAnswer
        data={data}
        answer={{ prompts: { a: "2", b: "9" } }}
        outcomes={[
          { name: "a", given: "2", correct: true },
          { name: "b", given: "9", correct: false },
        ]}
        readonly
        locale="en"
        onChange={vi.fn()}
      />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    await waitFor(() => expect(promptStates.get("a")).toBe("correct:locked"));
    expect(promptStates.get("b")).toBe("incorrect:locked");
  });

  it("says in words what the colours say, and how many were right", async () => {
    render(
      <MathAnswer
        data={data}
        answer={{ prompts: { a: "2", b: "9" } }}
        outcomes={[
          { name: "a", given: "2", correct: true },
          { name: "b", given: "9", correct: false },
        ]}
        readonly
        locale="en"
        onChange={vi.fn()}
      />,
    );

    // `setPromptState` tints the gap and nothing else. Colour alone is not a
    // result a screen reader can read, or a colour-blind learner can trust.
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("1 of 2 right."),
    );
    const said = screen.getByRole("status");
    expect(said.textContent).toContain("Blank a: Right");
    expect(said.textContent).toContain("Blank b: Not right");
  });
});

describe("the field is not rebuilt under the learner", () => {
  it("survives a re-render with a new onChange identity", async () => {
    const { container, rerender } = render(<Live data={make()} />);
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());
    expect(mounted).toBe(1);

    rerender(<Live data={make()} />);
    // A rebuilt mathfield takes the caret, the selection and any open keyboard
    // with it — mid-answer, which is the only time it would happen.
    expect(mounted).toBe(1);
  });

  it("does not write back the change it just announced", async () => {
    const { container } = render(<Live data={make()} />);
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());
    const field = fieldIn(container);

    field.simulate(undefined, "2x");
    await waitFor(() => expect(field.value).toBe("2x"));
    // Assigning `value` back would put the caret at the end on every keystroke.
    field.value = "2x|caret-kept";
    await new Promise((r) => setTimeout(r, 20));
    expect(field.value).toBe("2x|caret-kept");
  });
});

describe("when the template changes underneath it", () => {
  // Found by reassigning `data` on a mounted `<bitflow-task-math>`: the field
  // is built once, so its `input` listener held the first render's idea of
  // whether there were blanks and of who to tell. It went on reporting a
  // two-blank answer for a one-box formula, to a callback nobody was reading.
  it("reports under the new shape, not the one it was built with", async () => {
    const withBlanks = make({
      latex: "\\placeholder[a]{}+\\placeholder[b]{}",
      blanks: { a: { expected: "1", accepted: [] }, b: { expected: "2", accepted: [] } },
    });
    const single = make({ latex: "" });

    const changed = vi.fn();
    const { container, rerender } = render(
      <MathAnswer
        data={withBlanks}
        answer={{ prompts: {} }}
        locale="en"
        onChange={changed}
      />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    rerender(
      <MathAnswer
        data={single}
        answer={{ prompts: {} }}
        locale="en"
        onChange={changed}
      />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    fieldIn(container).simulate(undefined, "2x");
    expect(changed).toHaveBeenLastCalledWith({ prompts: { answer: "2x" } });
  });

  it("still talks to the callback it was last given", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const data = make();
    const { container, rerender } = render(
      <MathAnswer data={data} answer={{ prompts: {} }} locale="en" onChange={first} />,
    );
    await waitFor(() => expect(fieldIn(container)).not.toBeNull());

    rerender(
      <MathAnswer data={data} answer={{ prompts: {} }} locale="en" onChange={second} />,
    );
    fieldIn(container).simulate(undefined, "2x");

    expect(second).toHaveBeenCalledWith({ prompts: { answer: "2x" } });
    expect(first).not.toHaveBeenCalled();
  });
});

describe("when MathLive cannot be loaded", () => {
  beforeEach(async () => {
    const mathfield = await import("./mathfield");
    vi.mocked(mathfield.loadMathfield).mockResolvedValue(undefined);
  });

  it("still lets the learner answer, in LaTeX", async () => {
    // Stateful, because a controlled box wired to a `vi.fn()` never updates
    // and every keystroke would land on an empty field.
    render(<Live data={make()} />);

    const box = await screen.findByLabelText("Your answer, as LaTeX");
    // Pasted rather than typed: `userEvent.type` reads `{` as its own key
    // syntax, and the braces are most of what LaTeX is.
    await userEvent.click(box);
    await userEvent.paste("\\frac{1}{2}");
    // A mathfield's value *is* LaTeX, so this is the same answer in the same
    // notation — not a lesser one that would be marked differently.
    expect((box as HTMLInputElement).value).toBe("\\frac{1}{2}");
  });

  it("says why, rather than showing an empty rectangle", async () => {
    render(
      <MathAnswer data={make()} answer={{ prompts: {} }} locale="en" onChange={vi.fn()} />,
    );
    expect(await screen.findByText(/could not be loaded/)).toBeDefined();
  });

  it("offers one box per blank", async () => {
    render(
      <MathAnswer
        data={make({
          latex: "\\placeholder[a]{}+\\placeholder[b]{}",
          blanks: { a: { expected: "2", accepted: [] }, b: { expected: "3", accepted: [] } },
        })}
        answer={{ prompts: {} }}
        locale="en"
        onChange={vi.fn()}
      />,
    );
    expect(await screen.findByLabelText("Blank a")).toBeDefined();
    expect(screen.getByLabelText("Blank b")).toBeDefined();
  });
});
