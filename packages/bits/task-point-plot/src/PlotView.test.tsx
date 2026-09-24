import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PlotView } from "./PlotView";
import { DataSchema, type Answer } from "./schema";

const data = DataSchema.parse({
  classes: [
    { id: "a", label: "Cat", color: "#017460", shape: "circle" },
    { id: "b", label: "Dog", color: "#a3282d", shape: "square" },
  ],
  points: [
    { id: "k1", x: 1, y: 1, class: "a" },
    { id: "q1", x: 5, y: 5, label: "Q", expected: "b" },
  ],
  evaluation: defaultEvaluation(),
});

let latest: Answer = { assignments: {} };

const Stateful = ({ readonly }: { readonly?: boolean }) => {
  const [answer, setAnswer] = useState<Answer>({ assignments: {} });
  latest = answer;
  return (
    <PlotView
      data={data}
      answer={answer}
      locale="en"
      readonly={readonly}
      onAssign={(pointId, classId) => {
        const assignments = { ...answer.assignments };
        if (classId === undefined) delete assignments[pointId];
        else assignments[pointId] = classId;
        setAnswer({ assignments });
      }}
    />
  );
};

afterEach(() => {
  document.body.replaceChildren();
  latest = { assignments: {} };
});

describe("<PlotView>", () => {
  it("assigns the chosen class to an open point that is tapped, and clears it on a second tap", () => {
    const { container } = render(<Stateful />);
    fireEvent.click(screen.getByRole("radio", { name: "Dog" }));
    const hit = container.querySelector(".bitflow-point-plot-hit")!;
    fireEvent.click(hit);
    expect(latest.assignments).toEqual({ q1: "b" });
    fireEvent.click(container.querySelector(".bitflow-point-plot-hit")!);
    expect(latest.assignments).toEqual({});
  });

  it("assigns from the list under the plot, without touching the diagram", () => {
    render(<Stateful />);
    fireEvent.change(screen.getByRole("combobox", { name: "Class for Q" }), {
      target: { value: "a" },
    });
    expect(latest.assignments).toEqual({ q1: "a" });
    expect(screen.getByRole("status").textContent).toBe(
      "Q, assigned to Cat",
    );
  });

  it("offers no palette and no tap target when read-only", () => {
    const { container } = render(<Stateful readonly />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(container.querySelector(".bitflow-point-plot-hit")).toBeNull();
  });

  it("says in words and with a symbol whether a point was right", () => {
    render(
      <PlotView
        data={data}
        answer={{ assignments: { q1: "a" } }}
        states={{ q1: "wrong" }}
        locale="en"
        readonly
        onAssign={() => {}}
      />,
    );
    expect(document.querySelector(".bitflow-point-plot-verdict-wrong")?.textContent).toBe("✗");
    expect(screen.getByText("wrong")).toBeDefined();
  });
});
