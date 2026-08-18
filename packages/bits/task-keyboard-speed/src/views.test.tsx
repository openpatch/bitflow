import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

const start = (): Data =>
  DataSchema.parse({
    text: "the quick brown fox",
    evaluation: { mode: "skip" },
  });

const Editing = ({ onData }: { onData?: (data: Data) => void } = {}) => {
  const [data, setData] = useState(start());
  onData?.(data);
  return (
    <Form data={data} locale="en" onChange={(next) => setData(next as Data)} errors={[]} />
  );
};

describe("<Form>", () => {
  it("offers speed only while the attempt is timed", () => {
    render(<Editing />);

    expect(screen.getByRole("option", { name: /a point for accuracy, another for speed/i })).toBeDefined();

    fireEvent.click(screen.getByLabelText(/time the attempt/i));

    expect(
      screen.queryByRole("option", { name: /another for speed/i }),
    ).toBeNull();
  });

  it("takes the task back to accuracy when timing is switched off", () => {
    let latest = start();
    render(<Editing onData={(data) => (latest = data)} />);

    fireEvent.change(screen.getByLabelText(/^Count$/), {
      target: { value: "accuracyAndSpeed" },
    });
    fireEvent.click(screen.getByLabelText(/time the attempt/i));

    // Rather than leaving a mark nobody could earn.
    expect(latest).toMatchObject({ timed: false, scoring: "accuracy" });
  });

  it("asks for a target speed only when speed is being counted", () => {
    render(<Editing />);

    expect(screen.queryByLabelText(/words a minute/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/^Count$/), {
      target: { value: "accuracyAndSpeed" },
    });

    expect(screen.getByLabelText(/words a minute/i)).toBeDefined();
  });

  it("says what switching timing off is for", () => {
    render(<Editing />);

    // The reason matters more than the switch: it is there for the class,
    // not for the author's convenience.
    expect(screen.getByText(/one finger, a switch or a head pointer/i)).toBeDefined();
  });

  it("keeps the accuracy needed as a percentage the author can read", () => {
    let latest = start();
    render(<Editing onData={(data) => (latest = data)} />);

    fireEvent.change(screen.getByLabelText(/accuracy needed/i), {
      target: { value: "80" },
    });

    expect(latest.requiredAccuracy).toBeCloseTo(0.8, 5);
  });
});
