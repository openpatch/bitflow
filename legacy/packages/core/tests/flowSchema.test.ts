import { uuidv4 } from "../src/uuid";
import { z } from "zod";
import { Flow } from "../src/flow";
import { makeFlowSchema } from "../src/flowSchema";
import { StartSchema, EndSchema } from "../src/bitsSchema"

const StartSimpleSchema = StartSchema.merge(
  z.object({
    subtype: z.literal("simple"),
    view: z.object({
      title: z.string(),
      markdown: z.string(),
    }),
  })
);

const EndTriesSchema = EndSchema.merge(
  z.object({
    subtype: z.literal("tries"),
    view: z.object({
      markdown: z.string(),
    }),
  })
)

describe("FlowSchema", () => {
  const FlowSchema = makeFlowSchema({
    start: StartSimpleSchema,
    end: EndTriesSchema,
    task: z.never(),
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
