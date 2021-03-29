import { uuidv4 } from "@bitflow/base";
import { FlowNodeSchema, FlowSchema, IFlow, IFlowNode } from "../src/schemas";

describe("schemas", () => {
  describe("FlowNodeSchema", () => {
    it("should throw no error", () => {
      const node: IFlowNode = {
        id: uuidv4(),
        position: {
          x: 0,
          y: 0,
        },
        type: "task",
        data: {
          name: "Name",
          description: "Description",
          subtype: "choice",
          view: {
            variant: "multiple",
            instruction: "",
            choices: [
              {
                markdown: "Choice A",
              },
            ],
          },
          evaluation: {
            correct: [],
            enableRetry: false,
            showFeedback: false,
            mode: "auto",
          },
          feedback: {
            choices: {},
            patterns: {},
          },
        },
      };

      const result = FlowNodeSchema.safeParse(node);
      expect(result.success).toBeTruthy();
      if (result.success && result.data.type === "task") {
        expect(result.data.data).toEqual(node.data);
      }
    });
    it("should throw an error", () => {
      const node: any = {
        id: uuidv4(),
        position: {
          x: 0,
          y: 0,
        },
        type: "bit",
        data: {
          id: uuidv4(),
          type: "task",
          name: "Name",
          description: "Description",
          subtype: "choice",
          instruction: "",
          choices: [
            {
              markdown: "Choice A",
            },
          ],
        },
      };
      const result = FlowNodeSchema.safeParse(node);
      expect(result.success).toBeFalsy();
    });
  });

  describe("FlowSchema", () => {
    it("should return true", () => {
      const flow: IFlow = {
        draft: false,
        name: "flow",
        nodes: [
          {
            type: "start",
            position: { x: 0, y: 0 },
            id: uuidv4(),
            data: {
              view: {
                markdown: "hi",
                title: "",
              },
            },
          },
          {
            type: "end",
            position: { x: 0, y: 0 },
            id: uuidv4(),
            data: {
              view: {
                markdown: "hi",
                listResults: false,
                showPoints: true,
              },
            },
          },
        ],
        edges: [],
        zoom: 1,
        position: [0, 0],
      };

      const result = FlowSchema.safeParse(flow);

      expect(result.success).toBeTruthy();

      if (result.success) {
        expect(result.data).toEqual(flow);
      }
    });

    it("should return false when mismatched edges", () => {
      const flow: any = {
        draft: true,
        id: uuidv4(),
        name: "flow",
        nodes: [],
        edges: [
          {
            id: uuidv4(),
            source: "bla",
            target: "two",
          },
        ],
        zoom: 1,
        position: [0, 0],
      };

      const result = FlowSchema.safeParse(flow);

      expect(result.success).toBeFalsy();
    });
  });
});
