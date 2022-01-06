import { uuidv4 } from "../src/uuid";
import { EndSchema as EndTriesSchema } from "@bitflow/end-tries";
import { StartSchema as StartSimpleSchema } from "@bitflow/start-simple";
import { TaskSchema as TaskChoiceSchema } from "@bitflow/task-choice";
import { TaskSchema as TaskInputSchema } from "@bitflow/task-input";
import { z } from "zod";
import { Flow } from "../src/flow";
import { makeFlowSchema } from "../src/flowSchema";

describe("FlowSchema", () => {
  const FlowSchema = makeFlowSchema({
    start: StartSimpleSchema,
    end: EndTriesSchema,
    task: z.union([TaskChoiceSchema, TaskInputSchema]),
    title: z.never(),
    input: z.never(),
  });

  it("should return true", () => {
    const flow: Flow = {
      draft: false,
      description: "",
      language: "en",
      visibility: "public",
      name: "flow",
      nodes: [
        {
          type: "start",
          position: { x: 0, y: 0 },
          id: uuidv4(),
          data: {
            name: "",
            description: "",
            subtype: "simple",
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
            name: "",
            description: "",
            subtype: "tries",
            view: {
              markdown: "hi",
            },
          },
        },
      ],
      edges: [],
      zoom: 1,
      position: [0, 0],
    };

    const result = FlowSchema.parse(flow);

    expect(result).toEqual(flow);
  });
});
