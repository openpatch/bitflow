import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Disclosure } from "./form";

const details = (summary: string) =>
  screen.getByText(summary).closest("details") as HTMLDetailsElement;

/**
 * `<details>` fires `toggle` on a later task, not during the click, so every
 * assertion about the callback has to let that task run first.
 */
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe("<Disclosure>", () => {
  it("starts closed, and opens when its own summary is used", async () => {
    render(
      <Disclosure summary="Pools">
        <p>inside</p>
      </Disclosure>,
    );
    expect(details("Pools").open).toBe(false);

    fireEvent.click(screen.getByText("Pools"));
    await settle();
    expect(details("Pools").open).toBe(true);
  });

  it("shows what is inside without being opened", () => {
    render(
      <Disclosure summary="Pools" aside="2 pools">
        <p>inside</p>
      </Disclosure>,
    );
    expect(details("Pools").textContent).toContain("2 pools");
  });

  describe("one inside another", () => {
    /**
     * React delivers a nested `<details>`'s toggle to its ancestors as well.
     * Reading `event.target` therefore let a child opening drag every
     * disclosure above it open — which nothing noticed until the editor put a
     * list of sections inside a settings group, and then the group unfolded
     * itself on load.
     */
    const nested = (onOuterChange = vi.fn()) => {
      render(
        <Disclosure summary="Sections" onOpenChange={onOuterChange}>
          <Disclosure summary="The passage">
            <p>inside</p>
          </Disclosure>
        </Disclosure>,
      );
      return onOuterChange;
    };

    it("leaves the outer one alone when the inner one opens", async () => {
      const onOuterChange = nested();

      fireEvent.click(screen.getByText("The passage"));
      await settle();

      expect(details("The passage").open).toBe(true);
      expect(details("Sections").open).toBe(false);
      expect(onOuterChange).not.toHaveBeenCalled();
    });

    it("still opens the outer one from its own summary", async () => {
      const onOuterChange = nested();

      fireEvent.click(screen.getByText("Sections"));
      await settle();

      expect(details("Sections").open).toBe(true);
      expect(onOuterChange).toHaveBeenCalledWith(true);
    });
  });

  it("lets the caller drive it, and reports what the reader did", async () => {
    const onOpenChange = vi.fn();
    render(
      <Disclosure summary="Pools" open={false} onOpenChange={onOpenChange}>
        <p>inside</p>
      </Disclosure>,
    );

    fireEvent.click(screen.getByText("Pools"));
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
