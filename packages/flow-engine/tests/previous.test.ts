import { FlowEdge, FlowNode } from "@bitflow/core";
import { previous } from "../src/previous";

describe("previous", () => {
  it("should return previous", async () => {
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
        target: "node-c",
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
    ];
    let previousNode = await previous({ nodes, edges, currentId: "node-c" });

    expect(previousNode?.id).toBe("node-a");
  });
});
