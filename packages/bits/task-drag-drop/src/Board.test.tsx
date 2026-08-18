import { defaultEvaluation } from "@bitflow/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Board } from "./Board";
import { DataSchema, type Data, type Placement } from "./schema";

const data = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    instruction: "",
    background: { src: "/cpu.png", alt: "A CPU diagram" },
    items: [
      { id: "alu", kind: "text", label: "ALU" },
      { id: "reg", kind: "text", label: "Registers" },
    ],
    zones: [
      {
        id: "alu-zone",
        label: "Arithmetic logic unit",
        rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        acceptedItemIds: ["alu"],
        score: 1,
      },
      {
        id: "reg-zone",
        label: "Register file",
        rect: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
        acceptedItemIds: ["reg"],
        score: 1,
      },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

const setup = (over: Partial<Data> = {}, placements: Placement[] = []) => {
  const onChange = vi.fn();
  const utils = render(
    <Board
      data={data(over)}
      placements={placements}
      locale="en"
      onChange={onChange}
    />,
  );
  const last = (): Placement[] =>
    onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

/**
 * `Board` is controlled, so a test that takes more than one step has to feed
 * its own changes back — otherwise the second click sees the first one's
 * board, not the one on screen.
 */
const Stateful = ({ over = {} as Partial<Data>, initial = [] as Placement[] }) => {
  const [placements, setPlacements] = useState(initial);
  return (
    <Board
      data={data(over)}
      placements={placements}
      locale="en"
      onChange={setPlacements}
    />
  );
};

describe("<Board>", () => {
  it("places a label by picking it up and choosing a region", async () => {
    const user = userEvent.setup();
    const { last } = setup();

    await user.click(screen.getByRole("button", { name: "ALU" }));
    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, empty" }),
    );

    expect(last()).toEqual([{ itemId: "alu", zoneId: "alu-zone" }]);
  });

  it("does nothing when a region is chosen with empty hands", async () => {
    const user = userEvent.setup();
    const { onChange } = setup();

    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, empty" }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("says which label is being held", async () => {
    const user = userEvent.setup();
    setup();

    const label = screen.getByRole("button", { name: "ALU" });
    await user.click(label);

    expect(label.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Holding ALU");
  });

  it("puts a label back down when it is chosen twice", async () => {
    const user = userEvent.setup();
    const { onChange } = setup();

    const label = screen.getByRole("button", { name: "ALU" });
    await user.click(label);
    await user.click(label);

    expect(label.getAttribute("aria-pressed")).toBe("false");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("puts a label back down on Escape", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "ALU" }));
    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: "ALU" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("names a region by what it holds, not just where it is", () => {
    setup({}, [{ itemId: "alu", zoneId: "alu-zone" }]);

    // The board's state has to be readable without seeing the picture.
    expect(
      screen.getByRole("button", {
        name: "Arithmetic logic unit, holding ALU",
      }),
    ).toBeDefined();
  });

  it("takes a label back when a full region is chosen with empty hands", async () => {
    const user = userEvent.setup();
    const { last } = setup({}, [{ itemId: "alu", zoneId: "alu-zone" }]);

    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, holding ALU" }),
    );

    expect(last()).toEqual([]);
  });

  it("moves a label rather than copying it when reuse is off", async () => {
    const user = userEvent.setup();
    render(<Stateful initial={[{ itemId: "alu", zoneId: "alu-zone" }]} />);

    // Take it back, then put it in the other region: one label, one place.
    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, holding ALU" }),
    );
    await user.click(screen.getByRole("button", { name: "ALU" }));
    await user.click(screen.getByRole("button", { name: "Register file, empty" }));

    expect(
      screen.getByRole("button", { name: "Arithmetic logic unit, empty" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Register file, holding ALU" }),
    ).toBeDefined();
  });

  it("fills the whole board one label at a time", async () => {
    const user = userEvent.setup();
    render(<Stateful />);

    await user.click(screen.getByRole("button", { name: "ALU" }));
    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, empty" }),
    );
    await user.click(screen.getByRole("button", { name: "Registers" }));
    await user.click(screen.getByRole("button", { name: "Register file, empty" }));

    expect(screen.getByText("Every label has been placed.")).toBeDefined();
  });

  it("lets one label fill several regions when reuse is on", async () => {
    const user = userEvent.setup();
    const { last } = setup({ allowMultiplePlacements: true }, [
      { itemId: "alu", zoneId: "alu-zone" },
    ]);

    // Still in the tray, because it may be used again.
    await user.click(screen.getByRole("button", { name: "ALU" }));
    await user.click(screen.getByRole("button", { name: "Register file, empty" }));

    expect(last()).toEqual([
      { itemId: "alu", zoneId: "alu-zone" },
      { itemId: "alu", zoneId: "reg-zone" },
    ]);
  });

  it("takes a placed label out of the tray", () => {
    setup({}, [{ itemId: "alu", zoneId: "alu-zone" }]);

    expect(screen.queryByRole("button", { name: "ALU" })).toBeNull();
    expect(screen.getByRole("button", { name: "Registers" })).toBeDefined();
  });

  it("says so when every label has been placed", () => {
    setup({}, [
      { itemId: "alu", zoneId: "alu-zone" },
      { itemId: "reg", zoneId: "reg-zone" },
    ]);

    expect(screen.getByText("Every label has been placed.")).toBeDefined();
  });

  it("accepts nothing once the answer is in", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Board
        data={data()}
        placements={[{ itemId: "alu", zoneId: "alu-zone" }]}
        locale="en"
        readonly
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Arithmetic logic unit, holding ALU" }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("spells the outcome out for a screen reader, not just in colour", () => {
    render(
      <Board
        data={data()}
        placements={[{ itemId: "reg", zoneId: "alu-zone" }]}
        states={{ "alu-zone": "wrong", "reg-zone": "empty" }}
        locale="en"
        readonly
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("not correct")).toBeDefined();
    expect(screen.getByText("left empty")).toBeDefined();
  });

  it("describes the picture, because the picture is the task", () => {
    setup();
    expect(screen.getByAltText("A CPU diagram")).toBeDefined();
  });
});
