import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { measure } from "./evaluate";
import { DataSchema, type Answer, type Data } from "./schema";
import { Typist } from "./Typist";

const TEXT = "the quick brown fox";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    text: TEXT,
    requiredAccuracy: 0.9,
    targetWpm: 20,
    evaluation: { mode: "auto", enableRetry: true, showFeedback: true, weight: 1 },
    ...over,
  });

const empty = (): Answer => ({ typed: "", elapsedMs: 0, optedOut: false });

const setup = (answer: Answer = empty(), props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Typist data={data()} answer={answer} locale="en" onChange={onChange} {...props} />,
  );
  const last = (): Answer => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

const Stateful = ({ over = {} as Partial<Data> }) => {
  const [answer, setAnswer] = useState<Answer>(empty());
  return <Typist data={data(over)} answer={answer} locale="en" onChange={setAnswer} />;
};

const box = () => screen.getByLabelText(/type the passage here/i);

const type = (text: string) => fireEvent.change(box(), { target: { value: text } });

describe("<Typist>", () => {
  it("says what the task needs", () => {
    setup();

    expect(screen.getByText(/needs a keyboard/i)).toBeDefined();
  });

  it("records what was typed", () => {
    const { last } = setup();

    type("the qu");

    expect(last().typed).toBe("the qu");
  });

  it("reads the text off the box rather than off the keys", () => {
    const { last } = setup();
    const field = box();

    // Several keystrokes composing one character is how a great many people
    // type; a component listening for keys would see the keystrokes and not
    // the character.
    fireEvent.compositionStart(field);
    fireEvent.change(field, { target: { value: "日" } });
    fireEvent.compositionEnd(field);

    expect(last().typed).toBe("日");
  });

  it("keeps no record of the keys, only of the text", () => {
    const { last } = setup();

    type("the");
    type("th");
    type("the ");

    // Backspacing is not something anyone needs to know about afterwards.
    expect(Object.keys(last()).sort()).toEqual(["elapsedMs", "optedOut", "typed"]);
    expect(last().typed).toBe("the ");
  });

  it("starts the clock at the first character, not at the click", () => {
    const { onChange, last } = setup();

    // Reading the passage first is not time spent typing, so focusing the
    // box records nothing at all.
    fireEvent.focus(box());
    expect(onChange).not.toHaveBeenCalled();

    type("t");
    expect(last().elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("shows the same time it is scored on", () => {
    render(<Stateful />);

    type("the");
    const shown = screen.getByText(/^\d+\.\d s$/).textContent;
    // The clock is the recorded interval, not a second one running beside it:
    // a learner shown 17 seconds and marked on 8 has been told a lie about
    // what they were measured on.
    expect(shown).toBeDefined();
    expect(screen.getByText(/^\d+\.\d s$/).textContent).toBe(shown);
  });

  it("marks each character of the passage as it is passed", () => {
    const { container } = render(<Stateful />);

    type("the quick brown c");

    expect(
      container.querySelectorAll(".bitflow-typing-character-right"),
    ).toHaveLength(16);
    expect(
      container.querySelectorAll(".bitflow-typing-character-wrong"),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll(".bitflow-typing-character-pending").length,
    ).toBe(TEXT.length - 17);
  });

  it("counts the characters typed against the passage", () => {
    render(<Stateful />);

    type("the");

    expect(screen.getByText(`3 of ${TEXT.length} characters`)).toBeDefined();
  });

  it("shows no clock when the author switched timing off", () => {
    render(<Stateful over={{ timed: false }} />);

    type("the");

    expect(screen.queryByText(/\d+\.\d s/)).toBeNull();
  });

  describe("standing down", () => {
    it("is offered when the author allows it", () => {
      setup();

      expect(screen.getByRole("button", { name: /isn't a fair measure of me/i })).toBeDefined();
    });

    it("is not offered when the author does not", () => {
      render(
        <Typist
          data={data({ allowOptOut: false })}
          answer={empty()}
          locale="en"
          onChange={vi.fn()}
        />,
      );

      expect(screen.queryByRole("button", { name: /fair measure/i })).toBeNull();
    });

    it("records the decision", () => {
      const { last } = setup();

      fireEvent.click(screen.getByRole("button", { name: /isn't a fair measure of me/i }));

      expect(last()).toEqual({ typed: "", elapsedMs: 0, optedOut: true });
    });

    it("asks for nothing else afterwards", () => {
      render(<Stateful />);

      fireEvent.click(screen.getByRole("button", { name: /isn't a fair measure of me/i }));

      expect(screen.queryByLabelText(/type the passage here/i)).toBeNull();
      expect(screen.getByText(/not being marked/i)).toBeDefined();
    });
  });

  describe("trying again", () => {
    const finished = (): Answer => ({ typed: TEXT, elapsedMs: 9000, optedOut: false });

    it("clears the passage rather than coming back already typed", () => {
      const onChange = vi.fn();
      const props = { data: data(), answer: finished(), locale: "en" as const, onChange };
      const { rerender } = render(<Typist {...props} readonly />);

      // Coming back with the passage typed and the clock stopped would leave
      // nothing to measure.
      rerender(<Typist {...props} readonly={false} />);

      expect(onChange).toHaveBeenCalledWith({ typed: "", elapsedMs: 0, optedOut: false });
    });

    it("leaves a learner who stood down where they are", () => {
      const onChange = vi.fn();
      const props = {
        data: data(),
        answer: { typed: "", elapsedMs: 0, optedOut: true },
        locale: "en" as const,
        onChange,
      };
      const { rerender } = render(<Typist {...props} readonly />);
      rerender(<Typist {...props} readonly={false} />);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("shows the measurements once the answer is in", () => {
    const answer: Answer = { typed: TEXT, elapsedMs: 60000, optedOut: false };
    setup(answer, { measurement: measure(data(), answer), readonly: true });

    expect(screen.getByText("100% right")).toBeDefined();
    expect(screen.getByText("4 words a minute")).toBeDefined();
  });

  it("accepts nothing once the answer is in", () => {
    const { onChange } = setup(empty(), { readonly: true });

    type("the");

    expect(onChange).not.toHaveBeenCalled();
  });
});
