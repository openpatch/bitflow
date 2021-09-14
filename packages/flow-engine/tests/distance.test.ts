import { FlowEdge, FlowNode } from "@bitflow/core";
import { distanceBetween } from "../src/distance";

describe("distance", () => {
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
    const progress = await distanceBetween({
      nodes,
      edges,
      from: "node-a",
      to: "end",
      mode: "optimistic",
    });
    expect(progress).toBe(3);
  });

  it("should take longer in pessimistic mode", async () => {
    const progressP = await distanceBetween({
      nodes,
      edges,
      from: "node-c",
      to: "end",
      mode: "optimistic",
    });
    const progressO = await distanceBetween({
      nodes,
      edges,
      from: "node-c",
      to: "end",
      mode: "pessimistic",
    });
    expect(progressO).toBeGreaterThan(progressP);
  });
  it("should do when finding a loop", async () => {
    const progress = await distanceBetween({
      nodes,
      edges,
      from: "node-loop",
      to: "end",
    });
    expect(progress).toBe(Number.NEGATIVE_INFINITY);
  });

  it("not find a distance", async () => {
    const d = await distanceBetween({
      nodes,
      edges,
      from: "node-c",
      to: "node-random",
    });
    expect(d).toBe(Number.NEGATIVE_INFINITY);
  });

  it("should work with an to array", async () => {
    const d = await distanceBetween({
      nodes,
      edges,
      from: "node-a",
      to: ["end", "node-c"],
    });
    expect(d).toBe(3);
  });
});
