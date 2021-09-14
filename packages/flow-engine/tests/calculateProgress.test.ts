import { FlowEdge, FlowNode } from "@bitflow/core";
import { calculateProgress } from "../src/calculateProgress";

describe("calculateProgress", () => {
  const nodes: FlowNode[] = [
    {
      id: "node-a",
      type: "title",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
    {
      id: "portal-input",
      type: "portal-input",
      position: { x: 0, y: 0 },
      data: {
        description: "",
        portal: "a",
      },
    },
    {
      id: "portal-output",
      type: "portal-output",
      position: { x: 0, y: 0 },
      data: {
        description: "",
        portal: "a",
      },
    },
    {
      id: "node-random",
      type: "split-random",
      position: { x: 0, y: 0 },
    },
    {
      id: "node-b",
      type: "title",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
    {
      id: "node-c",
      type: "title",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
    {
      id: "node-d",
      type: "title",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
    {
      id: "node-loop",
      type: "title",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
    {
      id: "end",
      type: "end",
      position: { x: 0, y: 0 },
      data: {
        name: "",
        description: "",
        subtype: "simple",
        view: {
          title: "",
          message: "",
        },
      },
    },
  ];

  const edges: FlowEdge[] = [
    {
      id: "edge-a",
      source: "node-random",
      sourceHandle: "a",
      target: "node-b",
    },
    {
      id: "edge-b",
      source: "portal-output",
      sourceHandle: "b",
      target: "end",
    },
    {
      id: "edge-d",
      source: "node-random",
      target: "portal-input",
    },
    {
      id: "edge-c",
      source: "node-a",
      target: "node-random",
    },
    {
      id: "edge-e",
      source: "node-b",
      target: "node-c",
    },
    {
      id: "edge-e",
      source: "node-c",
      target: "end",
    },
    {
      id: "edge-f",
      source: "node-c",
      target: "node-d",
    },
    {
      id: "edge-g",
      source: "node-d",
      target: "end",
    },
    {
      id: "edge-loop",
      source: "node-loop",
      target: "node-loop",
    },
  ];
  it("it should work with portals", async () => {
    const progress = await calculateProgress({
      nodes,
      edges,
      currentId: "node-a",
      mode: "optimistic",
    });
    expect(progress).toBe(3);
  });

  it("should take longer in pessimistic mode", async () => {
    const progressP = await calculateProgress({
      nodes,
      edges,
      currentId: "node-c",
      mode: "optimistic",
    });
    const progressO = await calculateProgress({
      nodes,
      edges,
      currentId: "node-c",
      mode: "pessimistic",
    });
    expect(progressO).toBeGreaterThan(progressP);
  });
  it("should do when finding a loop", async () => {
    const progress = await calculateProgress({
      nodes,
      edges,
      currentId: "node-loop",
    });
    expect(progress).toBe(Number.NEGATIVE_INFINITY);
  });
});
