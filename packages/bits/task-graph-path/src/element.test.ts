import { defaultEvaluation } from "@bitflow/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";

const data = {
  instruction: "Find the cheapest route from A to D.",
  directed: false,
  weighted: true,
  nodes: [
    { id: "a", label: "A", x: 0.2, y: 0.2 },
    { id: "b", label: "B", x: 0.8, y: 0.2 },
    { id: "c", label: "C", x: 0.2, y: 0.8 },
    { id: "d", label: "D", x: 0.8, y: 0.8 },
  ],
  edges: [
    { id: "ab", source: "a", target: "b", weight: 1 },
    { id: "ac", source: "a", target: "c", weight: 4 },
    { id: "bd", source: "b", target: "d", weight: 1 },
    { id: "cd", source: "c", target: "d", weight: 5 },
  ],
  goal: "shortestPath",
  sourceId: "a",
  targetId: "d",
  traversal: "bfs",
  neighbourOrder: "label",
  partialCredit: true,
  evaluation: defaultEvaluation(),
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-task-graph-path") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

const button = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll("button")].find(
    (candidate) => candidate.textContent === label,
  );

afterEach(() => document.body.replaceChildren());

describe("<bitflow-task-graph-path>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-task-graph-path")).toBeDefined();
  });

  it("draws the graph it was given", async () => {
    const element = await mount();

    expect(element.querySelectorAll(".bitflow-graph-node")).toHaveLength(4);
    expect(element.querySelectorAll(".bitflow-graph-edge")).toHaveLength(4);
  });

  it("reports a choice through the standard answer event", async () => {
    const element = await mount();
    const listener = vi.fn();
    document.addEventListener("bitflow-answerchange", listener);

    button(element, "Add A")?.click();
    await flush();

    expect(listener.mock.calls[0][0].detail.answer).toEqual({
      nodeIds: ["a"],
      edgeIds: [],
    });
    document.removeEventListener("bitflow-answerchange", listener);
  });

  it("renders a place's name as text and never as markup", async () => {
    const element = await mount({
      data: {
        ...data,
        nodes: [
          { ...data.nodes[0], label: "<script>window.ran = true</script>" },
          ...data.nodes.slice(1),
        ],
      },
    });

    // A `.bitflow` file can come from anywhere.
    expect(element.querySelector("script")).toBeNull();
    expect((window as unknown as Record<string, unknown>).ran).toBeUndefined();
  });

  it("evaluates in the browser, with no answer key request", async () => {
    const { evaluate } = await import("./evaluate");
    const { DataSchema } = await import("./schema");

    const result = evaluate({
      data: DataSchema.parse(data),
      answer: { nodeIds: ["a", "b", "d"], edgeIds: [] },
    });

    expect(result.state).toBe("correct");
  });
});
