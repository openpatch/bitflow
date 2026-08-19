import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Disclosure, usePanels } from "./form";

/** A list the author can add to, remove from and reorder — as the bits are. */
const List = ({ initial }: { initial: string[] }) => {
  const [ids, setIds] = useState(initial);
  const panels = usePanels(ids);

  return (
    <>
      <button type="button" onClick={() => setIds([...ids, `id-${ids.length + 1}`])}>
        Add
      </button>
      <button type="button" onClick={() => setIds(ids.slice(1))}>
        Drop the first
      </button>
      {ids.map((id) => (
        <Disclosure key={id} summary={id} {...panels.props(id)}>
          <p>{id} body</p>
        </Disclosure>
      ))}
    </>
  );
};

const isOpen = (summary: string) =>
  screen.getByText(summary).closest("details")?.open ?? false;

describe("usePanels", () => {
  it("starts every panel the list already had closed", () => {
    render(<List initial={["id-1", "id-2"]} />);
    expect(isOpen("id-1")).toBe(false);
    expect(isOpen("id-2")).toBe(false);
  });

  it("opens a panel that appears, so an added row is ready to fill in", async () => {
    const user = userEvent.setup();
    render(<List initial={["id-1"]} />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(isOpen("id-2")).toBe(true);
    // …and does not disturb the ones that were already there.
    expect(isOpen("id-1")).toBe(false);
  });

  it("lets the author close what it opened", async () => {
    const user = userEvent.setup();
    render(<List initial={["id-1"]} />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByText("id-2"));

    expect(isOpen("id-2")).toBe(false);
  });

  /**
   * Keyed by id rather than position: a removal shifts every later row up, and
   * an index-keyed panel would hand its open state to whatever moved into the
   * slot.
   */
  it("keeps a panel's state with its own row when the list shifts", async () => {
    const user = userEvent.setup();
    render(<List initial={["id-1", "id-2"]} />);

    await user.click(screen.getByText("id-2"));
    expect(isOpen("id-2")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Drop the first" }));

    expect(isOpen("id-2")).toBe(true);
  });
});
