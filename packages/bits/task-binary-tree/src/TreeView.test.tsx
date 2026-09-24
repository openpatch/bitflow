import { defaultEvaluation } from "@bitflow/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DataSchema, type Answer, type Data } from "./schema";
import { parseTreeText } from "./tree";
import { TreeView } from "./TreeView";

const tree = (() => {
  const result = parseTreeText("2 (1) (3)");
  if ("error" in result) throw new Error(result.error);
  return result.tree;
})();

let latest: Answer | undefined;

const Stateful = ({ data, readonly }: { data: Data; readonly?: boolean }) => {
  const [answer, setAnswer] = useState<Answer>({ sequence: [], placements: [] });
  latest = answer;
  return (
    <TreeView data={data} answer={answer} locale="en" readonly={readonly} onChange={setAnswer} />
  );
};

afterEach(() => {
  document.body.replaceChildren();
  latest = undefined;
});

describe("<TreeView>", () => {
  const traversal = DataSchema.parse({ tree, evaluation: defaultEvaluation() });

  it("adds places to the order by tapping them in the diagram", () => {
    const { container } = render(<Stateful data={traversal} />);
    const nodes = container.querySelectorAll(".bitflow-tree-node");
    fireEvent.click(nodes[0]);
    fireEvent.click(nodes[1]);
    expect(latest?.sequence).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toBe("2 added, step 2");
  });

  it("does the same from the buttons, and undoes the last one", () => {
    render(<Stateful data={traversal} />);
    fireEvent.click(screen.getByRole("button", { name: "Add 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add 3" }));
    expect(screen.getByRole("button", { name: "Add 1" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latest?.sequence).toHaveLength(1);
  });

  it("offers 'Not found' only when searching", () => {
    render(<Stateful data={traversal} />);
    expect(screen.queryByRole("button", { name: "Not found" })).toBeNull();
    document.body.replaceChildren();

    render(
      <Stateful
        data={DataSchema.parse({ tree, mode: "search", searchKey: "5", evaluation: defaultEvaluation() })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Not found" }));
    expect(latest?.notFound).toBe(true);
  });

  it("inserts the next key into the empty place that is chosen", () => {
    const data = DataSchema.parse({
      mode: "insert",
      tree,
      insertKeys: ["4"],
      evaluation: defaultEvaluation(),
    });
    render(<Stateful data={data} />);
    expect(screen.getByText("Next key to insert: 4")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Right of 3" }));
    expect(latest?.placements).toEqual([{ key: "4", parent: tree.nodes[2].id, side: "right" }]);
    expect(screen.getByText("All keys are placed.")).toBeDefined();
  });

  it("changes nothing when read-only", () => {
    const { container } = render(<Stateful data={traversal} readonly />);
    fireEvent.click(container.querySelector(".bitflow-tree-node")!);
    expect(latest?.sequence).toEqual([]);
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });
});
