import { uuidv4 } from "@bitflow/base";
import {
  InputBitsPublicSchema,
  InputBitsSchema,
  TaskBitsPublicSchema,
  TaskBitsSchema,
  TitleBitsPublicSchema,
  TitleBitsSchema,
} from "@bitflow/bits";
import * as z from "zod";

const EqualSchema = z.object({
  type: z.literal("equal"),
  not: z.boolean().default(false),
  nodeId: z.string(),
  key: z.string(),
  value: z.union([z.string(), z.number()]),
});

const TrueSchema = z.object({
  type: z.literal("true"),
  not: z.boolean().default(false),
  nodeId: z.string(),
  key: z.string(),
});

const GreaterSchema = z.object({
  type: z.literal("greater"),
  include: z.boolean().default(false),
  not: z.boolean().default(false),
  nodeId: z.string(),
  key: z.string(),
  value: z.number(),
});

const LessSchema = z.object({
  type: z.literal("less"),
  include: z.boolean().default(false),
  not: z.boolean().default(false),
  nodeId: z.string(),
  key: z.string(),
  value: z.number(),
});

const InSchema = z.object({
  type: z.literal("in"),
  not: z.boolean().default(false),
  nodeId: z.string(),
  key: z.string(),
  value: z.array(z.union([z.string(), z.number()])),
});

export const PrimitiveCondition = z.union([
  EqualSchema,
  TrueSchema,
  InSchema,
  GreaterSchema,
  LessSchema,
]);

export type IPrimitiveCondition = z.infer<typeof PrimitiveCondition>;

// export const ConditionSchema = PrimitiveCondition;

export const ConditionSchema = z.union([
  PrimitiveCondition,
  z.object({
    type: z.literal("or"),
    conditions: z.array(PrimitiveCondition),
  }),
  z.object({
    type: z.literal("and"),
    conditions: z.array(PrimitiveCondition),
  }),
]);

export type ICondition = z.infer<typeof ConditionSchema>;

const FlowNodeBaseSchema = z.object({
  id: z.string().uuid().default(uuidv4()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const FlowNodeBasePublicSchema = FlowNodeBaseSchema.pick({ id: true });

/**
 * TODO Extract into custom package and add a new shell for allowing subtypes
 * for the start and end node. AKA make start and end a bit.
 */
export const StartSchema = z.object({
  view: z.object({
    title: z.string(),
    markdown: z.string(),
  }),
});

export type IStart = z.infer<typeof StartSchema>;

export const EndSchema = z.object({
  view: z.object({
    markdown: z.string(),
    showPoints: z.boolean(),
    listResults: z.boolean(),
  }),
});

export type IEnd = z.infer<typeof EndSchema>;

export const SplitAnswerSchema = z.object({
  condition: ConditionSchema,
});

export type ISplitAnswer = z.infer<typeof SplitAnswerSchema>;

export const SplitResultSchema = z.object({
  condition: ConditionSchema,
});

export type ISplitResult = z.infer<typeof SplitResultSchema>;

export const SplitPointsSchema = z.object({
  points: z.number().min(0),
});

export type ISplitPoints = z.infer<typeof SplitPointsSchema>;

export const PortalSchema = z.object({
  portal: z.string(),
  description: z.string(),
});

export type IPortal = z.infer<typeof PortalSchema>;

export const FlowNodeSchema = z.union([
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("start"),
      data: StartSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("end"),
      data: EndSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("title"),
      data: TitleBitsSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("task"),
      data: TaskBitsSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("input"),
      data: InputBitsSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("split-answer"),
      data: SplitAnswerSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("split-result"),
      data: SplitResultSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("split-points"),
      data: SplitPointsSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("split-random"),
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("portal-input"),
      data: PortalSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("portal-output"),
      data: PortalSchema,
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("checkpoint"),
    })
  ),
  FlowNodeBaseSchema.merge(
    z.object({
      type: z.literal("synchronize"),
    })
  ),
]);

export type IFlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowNodePublicSchema = z.union([
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("start"),
      data: StartSchema.pick({ view: true }),
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("end"),
      data: EndSchema.pick({ view: true }),
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("title"),
      data: TitleBitsPublicSchema,
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("task"),
      data: TaskBitsPublicSchema,
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("input"),
      data: InputBitsPublicSchema,
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("checkpoint"),
    })
  ),
  FlowNodeBasePublicSchema.merge(
    z.object({
      type: z.literal("synchronize"),
    })
  ),
]);

export const extractPublicNode = (
  node: IFlowNode & {
    type:
      | "start"
      | "end"
      | "task"
      | "input"
      | "title"
      | "checkpoint"
      | "synchronize";
  }
): IFlowNodePublic => {
  if (node.type === "task" || node.type === "input" || node.type === "title") {
    return {
      type: node.type,
      id: node.id,
      data: {
        name: node.data.name,
        view: node.data.view as any,
        subtype: node.data.subtype as any,
      },
    };
  } else if (node.type === "start" || node.type === "end") {
    return {
      type: node.type,
      id: node.id,
      data: {
        view: node.data.view as any,
      },
    };
  }
  return {
    type: node.type,
    id: node.id,
  };
};

export type IFlowNodePublic = z.infer<typeof FlowNodePublicSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string().uuid().default(uuidv4()),
  source: z.string().uuid(),
  sourceHandle: z.string().regex(/[a-z]/).optional(),
  target: z.string().uuid(),
});

export type IFlowEdge = z.infer<typeof FlowEdgeSchema>;

export const FlowSchema = z
  .object({
    name: z.string(),
    draft: z.boolean().default(false),
    nodes: z.array(FlowNodeSchema).refine(
      (nodes) => {
        let hasStart = false;
        let hasEnd = false;

        for (let node of nodes) {
          if (node.type === "start") {
            if (hasStart) {
              return false;
            }
            hasStart = true;
          } else if (node.type === "end") {
            if (hasEnd) {
              return false;
            }
            hasEnd = true;
          }
        }

        return hasStart && hasEnd;
      },
      {
        message: "One and only one start and end node is required.",
      }
    ),
    edges: z.array(FlowEdgeSchema),
    zoom: z.number().positive().default(1).optional(),
    position: z.tuple([z.number(), z.number()]).default([0, 0]).optional(),
  })
  .refine(
    (data) => {
      const ids = data.nodes.map((n) => n.id);
      for (let edge of data.edges) {
        if (!ids.includes(edge.source) || !ids.includes(edge.target)) {
          return false;
        }
      }
      return true;
    },
    { message: "Target and source of an edge need to be valid node ids." }
  );

export type IFlow = z.infer<typeof FlowSchema>;
