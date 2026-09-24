import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DataSchema, type Data } from "./schema";
import { Form } from "./views";

afterEach(() => document.body.replaceChildren());

const Editing = () => {
  const [data, setData] = useState<Data>(DataSchema.parse({ evaluation: { ...defaultEvaluation(), mode: "skip" } }));
  return <Form data={data} locale="en" onChange={setData} />;
};

describe("<Form>", () => {
  it("keeps a trailing comma while the next value is typed", () => {
    render(<Editing />);
    const initial = screen.getByRole("textbox", { name: /Starting array/i }) as HTMLInputElement;
    fireEvent.change(initial, { target: { value: "5," } });
    expect(initial.value).toBe("5,");
    fireEvent.change(initial, { target: { value: "5, 2" } });
    expect(initial.value).toBe("5, 2");
    expect(screen.getByText(/5 · 2/)).toBeDefined();
  });
});
