import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  instruction: "Walk the tree in inorder.",
  mode: "traversal",
  traversal: "inorder",
  tree: {
    root: "b",
    nodes: [
      { id: "b", label: "2", left: "a", right: "c" },
      { id: "a", label: "1" },
      { id: "c", label: "3" },
    ],
  },
  searchKey: "",
  insertKeys: [],
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-binary-tree>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-binary-tree")).toBeDefined();
  });

  it("draws a node and a button per place, and says the order to walk in", async () => {
    const element = document.createElement("bitflow-task-binary-tree") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { data, locale: "en" });
    document.body.append(element);
    await flush();

    expect(element.querySelectorAll(".bitflow-tree-node")).toHaveLength(3);
    expect(element.textContent).toContain("in inorder order");
  });
});
