import {
  checkCondition,
  checkPrimitiveCondition,
  next,
  previous,
  processLinear,
  processSplitResult,
} from "../src/engine";
import { IFlowEdge, IFlowNode } from "../src/schemas";

describe("engine", () => {
  describe("processLinear", () => {
    it("should return the next node", async () => {
      const outgoers: IFlowNode[] = [
        {
          id: "node-next",
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

      const nextNode = await processLinear({ outgoers });
      expect(nextNode.id).toBe("node-next");
    });
  });

  describe("processSplitPoints", () => {
    const nodes: IFlowNode[] = [
      {
        id: "node-split-points",
        position: { x: 0, y: 0 },
        type: "split-points",
        data: {
          points: 5,
        },
      },
      {
        id: "node-b",
        position: { x: 0, y: 0 },
        type: "task",
        data: {
          subtype: "choice",
          description: "",
          name: "",
          view: {
            choices: [
              {
                markdown: "Answer A",
              },
            ],
            instruction: "",
            variant: "multiple",
          },
          evaluation: {
            mode: "auto",
            correct: [],
            enableRetry: false,
            showFeedback: false,
          },
          feedback: {
            patterns: {},
            choices: {},
          },
        },
      },
      {
        id: "node-a",
        position: { x: 0, y: 0 },
        type: "task",
        data: {
          subtype: "choice",
          description: "",
          name: "",
          view: {
            choices: [
              {
                markdown: "Answer A",
              },
            ],
            instruction: "",
            variant: "multiple",
          },
          evaluation: {
            mode: "auto",
            correct: [],
            enableRetry: false,
            showFeedback: false,
          },
          feedback: {
            patterns: {},
            choices: {},
          },
        },
      },
    ];
    const edges: IFlowEdge[] = [
      {
        id: "edge-a",
        source: "node-split-points",
        sourceHandle: "b",
        target: "node-b",
      },
      {
        id: "edge-a",
        source: "node-split-points",
        sourceHandle: "a",
        target: "node-a",
      },
    ];

    const getAnswers = jest.fn();
    const getResults = jest.fn();
    it("should return first outgoer", async () => {
      const getPoints = jest.fn().mockReturnValue(4);
      const nextNode = await next({
        currentId: "node-split-points",
        nodes,
        edges,
        getPoints,
        getAnswers,
        getResults,
      });

      expect(nextNode?.id).toBe("node-a");
    });

    it("should return second outgoer", async () => {
      const getPoints = jest.fn().mockReturnValue(6);
      const nextNode = await next({
        currentId: "node-split-points",
        nodes,
        edges,
        getPoints,
        getAnswers,
        getResults,
      });

      expect(nextNode?.id).toBe("node-b");
    });
  });

  describe("processSplitResult", () => {
    const currentNode: IFlowNode = {
      id: "node-split-result",
      type: "split-result",
      position: { x: 0, y: 0 },
      data: {
        condition: {
          type: "and",
          conditions: [
            {
              type: "equal",
              not: false,
              nodeId: "a-node-id",
              key: "choices.a.state",
              value: "correct",
            },
            {
              type: "equal",
              not: false,
              nodeId: "b-node-id",
              key: "choices.b.state",
              value: "wrong",
            },
          ],
        },
      },
    };
    const outgoers: IFlowNode[] = [
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

    it("should return next node (true path)", async () => {
      const getResults = jest.fn().mockReturnValue(
        new Promise((resolve) =>
          resolve({
            "a-task-id": {
              choices: {
                a: {
                  state: "correct",
                },
                b: {
                  state: "correct",
                },
              },
            },
          })
        )
      );

      const nextNode = await processSplitResult({
        currentNode,
        outgoers,
        getResults,
      });

      expect(nextNode?.id).toBe("node-c");
    });

    it("should return next node (false path)", async () => {
      const getResults = jest.fn().mockReturnValue(
        new Promise((resolve) =>
          resolve({
            "a-task-id": {
              choices: {
                a: {
                  state: "wrong",
                },
                b: {
                  state: "correct",
                },
              },
            },
          })
        )
      );

      const nextNode = await processSplitResult({
        currentNode,
        outgoers,
        getResults,
      });

      expect(nextNode?.id).toBe("node-c");
    });
  });
  describe("previous", () => {
    it("should return previous", async () => {
      const nodes: IFlowNode[] = [
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

      const edges: IFlowEdge[] = [
        {
          id: "edge-a",
          source: "node-random",
          sourceHandle: "a",
          target: "node-b",
        },
        {
          id: "edge-b",
          source: "node-random",
          sourceHandle: "b",
          target: "node-c",
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
  describe("next", () => {
    it("should return next node with current node input and following random", async () => {
      const nodes: IFlowNode[] = [
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

      const edges: IFlowEdge[] = [
        {
          id: "edge-a",
          source: "node-random",
          sourceHandle: "a",
          target: "node-b",
        },
        {
          id: "edge-b",
          source: "node-random",
          sourceHandle: "b",
          target: "node-c",
        },
        {
          id: "edge-c",
          source: "node-a",
          target: "node-random",
        },
      ];

      const getAnswers = jest.fn();
      const getResults = jest.fn();
      const getPoints = jest.fn();

      jest.spyOn(global.Math, "random").mockReturnValue(0.3);
      let nextNode = await next({
        currentId: "node-a",
        edges,
        nodes,
        getAnswers,
        getResults,
        getPoints,
      });
      expect(nextNode?.id).toBe("node-b");

      jest.spyOn(global.Math, "random").mockReturnValue(0.7);
      nextNode = await next({
        currentId: "node-a",
        edges,
        nodes,
        getAnswers,
        getResults,
        getPoints,
      });
      expect(nextNode?.id).toBe("node-c");

      jest.spyOn(global.Math, "random").mockRestore();
    });
    it("should return next node with current node input", async () => {
      const nodes: IFlowNode[] = [
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
      ];
      const edges: IFlowEdge[] = [
        {
          id: "edge-a",
          source: "node-a",
          target: "node-d",
        },
        {
          id: "edge-b",
          source: "node-d",
          target: "node-a",
        },
        {
          id: "edge-c",
          source: "node-b",
          target: "node-c",
        },
      ];

      const currentId = "node-a";

      const getAnswers = jest.fn();
      const getResults = jest.fn();
      const getPoints = jest.fn();

      const nextNode = await next({
        currentId,
        nodes,
        edges,
        getAnswers,
        getResults,
        getPoints,
      });
      expect(nextNode?.id).toBe("node-d");
    });
  });

  describe("checkCondition", () => {
    it("should return true for and", () => {
      const check = checkCondition(
        {
          type: "and",
          conditions: [
            {
              type: "true",
              nodeId: "node1",
              key: "value",
              not: false,
            },
            {
              type: "equal",
              nodeId: "node2",
              key: "bla-bla",
              not: false,
              value: "one",
            },
          ],
        },
        {
          node1: {
            value: true,
          },
          node2: {
            "bla-bla": "one",
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return false for and", () => {
      const check = checkCondition(
        {
          type: "and",
          conditions: [
            {
              type: "true",
              nodeId: "node1",
              key: "value",
              not: true,
            },
            {
              type: "equal",
              nodeId: "node2",
              key: "bla-bla",
              not: false,
              value: "one",
            },
          ],
        },
        {
          node1: {
            value: true,
          },
          node2: {
            "bla-bla": "one",
          },
        }
      );

      expect(check).toBeFalsy();
    });

    it("should return true for or", () => {
      const check = checkCondition(
        {
          type: "or",
          conditions: [
            {
              type: "true",
              nodeId: "node1",
              key: "value",
              not: true,
            },
            {
              type: "equal",
              nodeId: "node2",
              key: "bla-bla",
              not: false,
              value: "one",
            },
          ],
        },
        {
          task1: {
            value: true,
          },
          task2: {
            "bla-bla": "one",
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return false for or", () => {
      const check = checkCondition(
        {
          type: "or",
          conditions: [
            {
              type: "true",
              nodeId: "node1",
              key: "value",
              not: true,
            },
            {
              type: "equal",
              nodeId: "node2",
              key: "bla-bla",
              not: true,
              value: "one",
            },
          ],
        },
        {
          node1: {
            value: true,
          },
          node2: {
            "bla-bla": "one",
          },
        }
      );

      expect(check).toBeFalsy();
    });
  });

  describe("checkPrimitiveCondition", () => {
    it("should return true for equal", () => {
      const check = checkPrimitiveCondition(
        {
          type: "equal",
          nodeId: "a-node",
          key: "hi.value",
          value: "two",
          not: false,
        },
        {
          "a-node": {
            hi: {
              value: "two",
            },
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return true for not equal", () => {
      const check = checkPrimitiveCondition(
        {
          type: "equal",
          nodeId: "a-node",
          key: "hi.value",
          value: "three",
          not: true,
        },
        {
          "a-node": {
            hi: {
              value: "two",
            },
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return false for equal", () => {
      const check = checkPrimitiveCondition(
        {
          type: "equal",
          nodeId: "a-node",
          key: "hi.value",
          value: "three",
          not: false,
        },
        {
          "a-node": {
            hi: {
              value: "two",
            },
          },
        }
      );

      expect(check).toBeFalsy();
    });

    it("should return false for not equal", () => {
      const check = checkPrimitiveCondition(
        {
          type: "equal",
          nodeId: "a-node",
          key: "hi.value",
          value: "two",
          not: true,
        },
        {
          "a-node": {
            hi: {
              value: "two",
            },
          },
        }
      );

      expect(check).toBeFalsy();
    });

    it("should return true for greater", () => {
      const check = checkPrimitiveCondition(
        {
          type: "greater",
          nodeId: "a-node",
          key: "hi.value",
          value: 5,
          not: false,
          include: false,
        },
        {
          "a-node": {
            hi: {
              value: 6,
            },
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return true for not greater", () => {
      const check = checkPrimitiveCondition(
        {
          type: "greater",
          nodeId: "a-node",
          key: "hi.value",
          value: 5,
          not: true,
          include: false,
        },
        {
          "a-node": {
            hi: {
              value: 4,
            },
          },
        }
      );

      expect(check).toBeTruthy();
    });

    it("should return false for greater", () => {
      const check = checkPrimitiveCondition(
        {
          type: "greater",
          nodeId: "a-node",
          key: "hi.value",
          value: 5,
          not: false,
          include: false,
        },
        {
          "a-node": {
            hi: {
              value: 4,
            },
          },
        }
      );

      expect(check).toBeFalsy();
    });

    it("should return false for not greater", () => {
      const check = checkPrimitiveCondition(
        {
          type: "greater",
          nodeId: "a-node",
          key: "hi.value",
          value: 5,
          not: true,
          include: false,
        },
        {
          "a-node": {
            hi: {
              value: 6,
            },
          },
        }
      );

      expect(check).toBeFalsy();
    });
  });
});
