import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataSchema, type Answer, type Data } from "./schema";
import { Form, Task } from "./views";

const task = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Write it in binary.",
    sourceRepresentation: "decimal",
    sourceValue: "42",
    targetRepresentation: "binary",
    bitWidth: 8,
    ...over,
  });

/** The task driving itself, since the reading only changes when the answer does. */
const Answering = ({ initial }: { initial: Data }) => {
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  return (
    <Task data={initial} answer={answer} locale="en" onAnswerChange={setAnswer} />
  );
};

const box = () => screen.getByLabelText<HTMLInputElement>(/your answer/i);

describe("<Task>", () => {
  it("shows the value, its representation and its width", () => {
    render(<Answering initial={task({ signed: true, sourceValue: "-42" })} />);

    expect(screen.getByText("-42")).toBeTruthy();
    expect(screen.getByText(/in decimal · 8-bit, signed/i)).toBeTruthy();
  });

  it("brings up a text keyboard for hex, whose letters a digits-only pad cannot type", () => {
    render(<Answering initial={task({ targetRepresentation: "hex" })} />);
    expect(box().inputMode).toBe("text");
  });

  it("keeps the numeric keypad for binary, which is digits only", () => {
    render(<Answering initial={task({ targetRepresentation: "binary" })} />);
    expect(box().inputMode).toBe("numeric");
  });

  it("says what it makes of what was typed, as it is typed", () => {
    // The one task type where the thing marked is not the thing typed, so
    // nobody is marked on a figure they cannot see.
    render(<Answering initial={task()} />);

    fireEvent.change(box(), { target: { value: "00101010" } });

    expect(screen.getByText("That reads as 42.")).toBeTruthy();
  });

  it("says when what was typed cannot be read at all", () => {
    render(<Answering initial={task()} />);

    fireEvent.change(box(), { target: { value: "0012" } });

    expect(screen.getByText(/cannot be read as binary/i)).toBeTruthy();
  });

  it("says nothing about an empty box", () => {
    render(<Answering initial={task()} />);

    expect(screen.queryByText(/that reads as/i)).toBeNull();
  });

  it("stores the raw text and nothing else", () => {
    const onAnswerChange = vi.fn();
    render(<Task data={task()} locale="en" onAnswerChange={onAnswerChange} />);

    fireEvent.change(box(), { target: { value: "0010" } });

    // What it comes to is derived; one stored copy that can disagree with the
    // box after a reload is worse than reading it twice.
    expect(onAnswerChange).toHaveBeenCalledWith({ raw: "0010" });
  });

  it("says what the answer has to look like", () => {
    render(<Answering initial={task()} />);

    expect(screen.getByText(/all 8 digits/i)).toBeTruthy();
    expect(screen.getByText(/0b, 0o or 0x/i)).toBeTruthy();
  });

  it("says what went wrong, without saying what was right", () => {
    render(
      <Task
        data={task()}
        answer={{ raw: "101010" }}
        result={{ state: "wrong", detail: { reason: "notFullWidth" } }}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(screen.getByText(/answer is 8 digits long/i)).toBeTruthy();
    expect(screen.queryByText("00101010")).toBeNull();
  });

  it("accepts no input once it is answered", () => {
    render(
      <Task
        data={task()}
        answer={{ raw: "00101010" }}
        readonly
        locale="en"
        onAnswerChange={() => {}}
      />,
    );

    expect(box().disabled).toBe(true);
  });
});

/** The form driving itself, since the preview follows every setting. */
const Editing = ({ initial }: { initial: Data }) => {
  const [data, setData] = useState(initial);
  return <Form data={data} locale="en" onChange={setData} errors={[]} />;
};

describe("<Form>", () => {
  it("shows the answer the settings produce", () => {
    render(<Editing initial={task()} />);

    expect(screen.getByText("00101010")).toBeTruthy();
  });

  it("follows the width as it is changed", () => {
    render(<Editing initial={task()} />);

    fireEvent.change(screen.getByLabelText(/width, in bits/i), {
      target: { value: "16" },
    });

    expect(screen.getByText("0000000000101010")).toBeTruthy();
  });

  it("shows the pattern rather than a minus sign for a signed value", () => {
    render(<Editing initial={task({ sourceValue: "-42", signed: true })} />);

    expect(screen.getByText("11010110")).toBeTruthy();
  });

  it("says so when the value cannot be read", () => {
    render(
      <Editing initial={task({ sourceValue: "", evaluation: { mode: "skip" } })} />,
    );

    expect(screen.getByText(/cannot be read yet/i)).toBeTruthy();
  });
});
