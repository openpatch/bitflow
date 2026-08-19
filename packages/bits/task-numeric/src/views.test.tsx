import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { read } from "./evaluate";
import { AUTHOR_DIGITS, formatValue, LEARNER_DIGITS } from "./NumericField";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const make = (changes: Partial<Data> = {}): Data =>
  DataSchema.parse({ expected: "0.75", ...changes });

/**
 * The task with its own state, because the assertions are about what happens
 * after typing and a controlled component wired to `vi.fn()` never updates.
 */
const Live = ({ data }: { data: Data }) => {
  const [answer, setAnswer] = useState<Answer>({ input: "" });
  return (
    <Task
      data={data}
      answer={answer}
      locale="en"
      onAnswerChange={setAnswer}
    />
  );
};

describe("Task", () => {
  it("labels the box", () => {
    render(<Live data={make()} />);
    expect(screen.getByLabelText("Your answer")).toBeDefined();
  });

  it("reports what it makes of a calculation, so nobody is marked on a hidden number", async () => {
    render(<Live data={make()} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "3/4");

    expect(screen.getByRole("status").textContent).toBe("Reads as 0.75");
  });

  it("says so when it cannot read the answer at all", async () => {
    render(<Live data={make()} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "3/");

    expect(screen.getByRole("status").textContent).toMatch(/not a number/);
  });

  it("stays quiet when the reading is the text back again", async () => {
    render(<Live data={make()} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "0.75");

    // A live region that speaks on every keystroke is worse than one that
    // waits until it has something to add.
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("prints the unit beside the box without asking for it", () => {
    render(<Live data={make({ unitMode: "shown", unit: "m/s^2" })} />);

    const input = screen.getByLabelText("Your answer");
    expect(screen.getByText("m/s^2")).toBeDefined();
    // Tied to the box, so it is read out rather than only seen.
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("m/s^2").id,
    );
  });

  it("says what precision will be marked rather than springing it", () => {
    render(<Live data={make({ tolerance: "significant", digits: 3 })} />);
    expect(screen.getByText(/three significant figures|3 significant figures/)).toBeDefined();
  });

  it("is a text box, so a half-typed exponent is not swallowed", () => {
    render(<Live data={make()} />);
    const input = screen.getByLabelText("Your answer") as HTMLInputElement;
    // `type="number"` empties itself on `1.5e`, mid-keystroke.
    expect(input.type).toBe("text");
    expect(input.inputMode).toBe("text");
  });

  it("offers the numeric keyboard when no calculation is allowed", () => {
    render(<Live data={make({ allowExpression: false })} />);
    expect(
      (screen.getByLabelText("Your answer") as HTMLInputElement).inputMode,
    ).toBe("decimal");
  });

  it("accepts no input once the answer has been checked", () => {
    render(
      <Task
        data={make()}
        answer={{ input: "0.75" }}
        readonly
        result={{ state: "correct", score: { earned: 1, possible: 1 } }}
        locale="en"
        onAnswerChange={vi.fn()}
      />,
    );
    expect((screen.getByLabelText("Your answer") as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("separates a right number from a wrong unit when it reports back", () => {
    const data = make({ unitMode: "required", unit: "kg", scoring: "valueAndUnit" });
    render(
      <Task
        data={data}
        answer={{ input: "0.75 g" }}
        readonly
        result={{
          state: "wrong",
          score: { earned: 1, possible: 2 },
          detail: read(data, "0.75 g"),
        }}
        locale="en"
        onAnswerChange={vi.fn()}
      />,
    );
    expect(screen.getByText("The number is right, but the unit is not.")).toBeDefined();
  });

  it("shows the learner their own decimal separator back", async () => {
    render(<Live data={make({ decimalSeparator: "both" })} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "3/4");

    // German reads 0,75; correcting them to a point they were not asked to
    // use would be answering a question nobody set.
    expect(formatValue(0.75, "de")).toBe("0,75");
    expect(formatValue(0.75, "en")).toBe("0.75");
    // The learner sees every figure they are marked on; the author sees fewer.
    expect(formatValue(Math.PI, "en", LEARNER_DIGITS)).toBe("3.14159265359");
    expect(formatValue(Math.PI, "en", AUTHOR_DIGITS)).toBe("3.14159");
  });
});

describe("Form", () => {
  const Editable = ({ initial }: { initial: Data }) => {
    const [data, setData] = useState(initial);
    return <Form data={data} locale="en" onChange={setData} />;
  };

  it("tells the author what their expected value comes to", () => {
    render(<Editable initial={make({ expected: "2*pi*0.35" })} />);
    // Six figures, not twelve: `2.19911485751` is exact and unreadable, and
    // the question the line answers is "is that about right?".
    expect(screen.getByText("Comes to 2.19911.")).toBeDefined();
  });

  it("keeps an author-facing range short enough to read", () => {
    render(
      <Editable
        initial={make({ expected: "2*pi*0.35", tolerance: "percent", toleranceValue: 2 })}
      />,
    );
    expect(
      screen.getByText("Anything from 2.15513 to 2.2431 will be accepted."),
    ).toBeDefined();
  });

  it("spells out the range a tolerance actually accepts", () => {
    render(
      <Editable
        initial={make({ expected: "100", tolerance: "absolute", toleranceValue: 2 })}
      />,
    );
    expect(screen.getByText("Anything from 98 to 102 will be accepted.")).toBeDefined();
  });

  it("shows the learner's own view, so the settings can be seen rather than read", () => {
    render(<Editable initial={make({ unitMode: "shown", unit: "kg" })} />);
    expect(screen.getByText("What the learner sees")).toBeDefined();
    // The preview is the real component, disabled — not a mock-up of it.
    const preview = screen.getByLabelText("Your answer") as HTMLInputElement;
    expect(preview.disabled).toBe(true);
  });

  it("takes the unit's mark away when the unit stops being asked for", async () => {
    const onChange = vi.fn();
    render(
      <Form
        data={make({ unitMode: "required", unit: "kg", scoring: "valueAndUnit" })}
        locale="en"
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(
      screen.getByLabelText("What about the unit?"),
      "none",
    );
    expect(onChange.mock.calls[0][0]).toMatchObject({
      unitMode: "none",
      scoring: "value",
    });
  });
});
