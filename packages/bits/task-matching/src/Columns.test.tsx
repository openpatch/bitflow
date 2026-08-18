import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Columns } from "./Columns";
import type { Match, Pair } from "./schema";

const pairs: Pair[] = [
  {
    id: "cpu",
    left: { kind: "text", label: "CPU" },
    right: { kind: "text", label: "Carries out instructions" },
  },
  {
    id: "ram",
    left: { kind: "text", label: "RAM" },
    right: { kind: "text", label: "Holds what is being worked on" },
  },
];

const setup = (matches: Match[] = [], props: Record<string, unknown> = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Columns
      pairs={pairs}
      leftOrder={["ram", "cpu"]}
      rightOrder={["cpu", "ram"]}
      matches={matches}
      locale="en"
      onChange={onChange}
      {...props}
    />,
  );
  const last = () => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

const Stateful = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  return (
    <Columns
      pairs={pairs}
      leftOrder={["ram", "cpu"]}
      rightOrder={["cpu", "ram"]}
      matches={matches}
      locale="en"
      onChange={setMatches}
    />
  );
};

describe("<Columns>", () => {
  it("shows each column in the order it was given", () => {
    setup();

    // Shuffled apart, or the pairs would line up row against row and the task
    // would be "match one to one".
    const labels = screen
      .getAllByRole("button")
      .map((b) => (b.getAttribute("aria-label") ?? "").split(",")[0]);
    expect(labels).toEqual([
      "RAM",
      "CPU",
      "Carries out instructions",
      "Holds what is being worked on",
    ]);
  });

  it("pairs a left card with a right one", async () => {
    const user = userEvent.setup();
    const { last } = setup();

    await user.click(screen.getByRole("button", { name: /^CPU/ }));
    await user.click(screen.getByRole("button", { name: /^Carries out/ }));

    expect(last()).toEqual([{ leftId: "cpu", rightId: "cpu" }]);
  });

  it("says which card is being held", async () => {
    const user = userEvent.setup();
    setup();

    const cpu = screen.getByRole("button", { name: /^CPU/ });
    await user.click(cpu);

    expect(cpu.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Holding CPU");
  });

  it("does nothing when a right card is chosen with empty hands", async () => {
    const user = userEvent.setup();
    const { onChange } = setup();

    await user.click(screen.getByRole("button", { name: /^Carries out/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("puts a held card down again on Escape", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /^CPU/ }));
    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: /^CPU/ }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("names a matched card by what it is matched with", () => {
    setup([{ leftId: "cpu", rightId: "ram" }]);

    // The pairing has to be readable without following lines across a gap.
    expect(
      screen.getByRole("button", {
        name: "CPU, matched with Holds what is being worked on",
      }),
    ).toBeDefined();
  });

  it("separates a pair when either of its cards is chosen", async () => {
    const user = userEvent.setup();
    const { last } = setup([{ leftId: "cpu", rightId: "cpu" }]);

    await user.click(screen.getByRole("button", { name: /^CPU, matched/ }));

    expect(last()).toEqual([]);
  });

  it("separates from the right-hand side too", async () => {
    const user = userEvent.setup();
    const { last } = setup([{ leftId: "cpu", rightId: "cpu" }]);

    await user.click(screen.getByRole("button", { name: /^Carries out.*matched/ }));

    expect(last()).toEqual([]);
  });

  it("replaces the pairing when an occupied card is chosen", async () => {
    const user = userEvent.setup();
    const { last } = setup([{ leftId: "cpu", rightId: "cpu" }]);

    // Holding one card and choosing an occupied one means "put this here
    // instead", not "undo that and forget what I was holding".
    await user.click(screen.getByRole("button", { name: /^RAM/ }));
    await user.click(screen.getByRole("button", { name: /^Carries out/ }));

    expect(last()).toEqual([{ leftId: "ram", rightId: "cpu" }]);
  });

  it("matches every pair one after another", async () => {
    const user = userEvent.setup();
    render(<Stateful />);

    await user.click(screen.getByRole("button", { name: /^CPU/ }));
    await user.click(screen.getByRole("button", { name: /^Carries out/ }));
    await user.click(screen.getByRole("button", { name: /^RAM/ }));
    await user.click(screen.getByRole("button", { name: /^Holds what/ }));

    expect(
      screen.getAllByRole("button").filter((b) =>
        (b.getAttribute("aria-label") ?? "").includes("matched with"),
      ),
    ).toHaveLength(4);
  });

  it("marks each pairing once the answer is in", () => {
    const { container } = setup(
      [
        { leftId: "cpu", rightId: "cpu" },
        { leftId: "ram", rightId: "cpu" },
      ],
      {
        results: [
          { leftId: "cpu", rightId: "cpu", correct: true },
          { leftId: "ram", rightId: "cpu", correct: false },
        ],
        readonly: true,
      },
    );

    expect(
      container.querySelectorAll(".bitflow-matching-card-correct").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll(".bitflow-matching-card-wrong").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("correct").length).toBeGreaterThan(0);
  });

  it("accepts nothing once the answer is in", async () => {
    const user = userEvent.setup();
    const { onChange } = setup([], { readonly: true });

    await user.click(screen.getByRole("button", { name: /^CPU/ }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
