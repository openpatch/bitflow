import { z, ZodSchema } from "zod";
import {
  AndCondition,
  Condition,
  EqualCondition,
  GreaterCondition,
  InCondition,
  LessCondition,
  OrCondition,
  PrimitiveCondition,
  TrueCondition,
} from "./flow";

const NodeBaseSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const FlowCheckpointNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("checkpoint"),
  })
);

export const FlowSynchronizeNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("synchronize"),
  })
);

export const makeFlowTaskNodeSchema = (task: ZodSchema<Bitflow.Task>) =>
  NodeBaseSchema.merge(
    z.object({
      type: z.literal("task"),
      data: task,
    })
  );

export const makeFlowStartNodeSchema = (start: ZodSchema<Bitflow.Start>) =>
  NodeBaseSchema.merge(
    z.object({
      type: z.literal("start"),
      data: start,
    })
  );

export const makeFlowEndNodeSchema = (end: ZodSchema<Bitflow.End>) =>
  NodeBaseSchema.merge(
    z.object({
      type: z.literal("end"),
      data: end,
    })
  );

export const makeFlowInputNodeSchema = (input: ZodSchema<Bitflow.Input>) =>
  NodeBaseSchema.merge(
    z.object({
      type: z.literal("input"),
      data: input,
    })
  );

export const makeFlowTitleNodeSchema = (title: ZodSchema<Bitflow.Title>) =>
  NodeBaseSchema.merge(
    z.object({
      type: z.literal("title"),
      data: title,
    })
  );

export const EqualConditionSchema: ZodSchema<EqualCondition> = z.object({
  type: z.literal("equal"),
  not: z.boolean(),
  nodeId: z.string(),
  key: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const TrueConditionSchema: ZodSchema<TrueCondition> = z.object({
  type: z.literal("true"),
  not: z.boolean(),
  nodeId: z.string(),
  key: z.string(),
});

export const GreaterConditionSchema: ZodSchema<GreaterCondition> = z.object({
  type: z.literal("greater"),
  include: z.boolean(),
  not: z.boolean(),
  nodeId: z.string(),
  key: z.string(),
  value: z.number(),
});

export const LessConditionSchema: ZodSchema<LessCondition> = z.object({
  type: z.literal("less"),
  include: z.boolean(),
  not: z.boolean(),
  nodeId: z.string(),
  key: z.string(),
  value: z.number(),
});

export const InConditionSchema: ZodSchema<InCondition> = z.object({
  type: z.literal("in"),
  not: z.boolean(),
  nodeId: z.string(),
  key: z.string(),
  value: z.array(z.union([z.string(), z.number()])),
});

export const PrimitiveConditionSchema: ZodSchema<PrimitiveCondition> = z.union([
  EqualConditionSchema,
  TrueConditionSchema,
  GreaterConditionSchema,
  LessConditionSchema,
  InConditionSchema,
]);

export const AndConditionSchema: ZodSchema<AndCondition> = z.object({
  type: z.literal("and"),
  conditions: z.array(PrimitiveConditionSchema),
});

export const OrConditionSchema: ZodSchema<OrCondition> = z.object({
  type: z.literal("or"),
  conditions: z.array(PrimitiveConditionSchema),
});

export const ConditionSchema: ZodSchema<Condition> = z.union([
  PrimitiveConditionSchema,
  AndConditionSchema,
  OrConditionSchema,
]);

export const SplitAnswerSchema = z.object({
  condition: ConditionSchema,
});

export const FlowSplitAnswerNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("split-answer"),
    data: SplitAnswerSchema,
  })
);

export const SplitResultSchema = z.object({
  condition: ConditionSchema,
});

export const FlowSplitResultNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("split-result"),
    data: SplitResultSchema,
  })
);

export const SplitPointsSchema = z.object({
  points: z.number(),
});

export const FlowSplitPointsNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("split-points"),
    data: SplitPointsSchema,
  })
);

export const PortalInputSchema = z.object({
  portal: z.string(),
  description: z.string(),
});

export const PortalOutputSchema = z.object({
  portal: z.string(),
  description: z.string(),
});

export const FlowPortalInputNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("portal-input"),
    data: PortalInputSchema,
  })
);

export const FlowPortalOutputNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("portal-output"),
    data: PortalOutputSchema,
  })
);

export const FlowSplitRandomNodeSchema = NodeBaseSchema.merge(
  z.object({
    type: z.literal("split-random"),
  })
);

export const ControlFlowNodeSchema = z.union([
  FlowSplitAnswerNodeSchema,
  FlowSplitResultNodeSchema,
  FlowSplitPointsNodeSchema,
  FlowSplitRandomNodeSchema,
  FlowPortalInputNodeSchema,
  FlowPortalOutputNodeSchema,
]);

export const makeInteractiveFlowNodeSchema = ({
  start,
  end,
  input,
  title,
  task,
}: {
  start: ZodSchema<Bitflow.Start>;
  end: ZodSchema<Bitflow.End>;
  input: ZodSchema<Bitflow.Input>;
  title: ZodSchema<Bitflow.Title>;
  task: ZodSchema<Bitflow.Task>;
}) =>
  z.union([
    makeFlowStartNodeSchema(start || z.record(z.any())),
    makeFlowEndNodeSchema(end || z.record(z.any())),
    makeFlowInputNodeSchema(input),
    makeFlowTaskNodeSchema(task),
    makeFlowTitleNodeSchema(title),
  ]);

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z
    .union([
      z.literal("a"),
      z.literal("b"),
      z.literal("c"),
      z.literal("d"),
      z.literal("e"),
      z.literal("f"),
    ])
    .optional(),
  target: z.string(),
});

export const makeFlowNodeSchema = ({
  end,
  input,
  start,
  task,
  title,
}: {
  start: ZodSchema<Bitflow.Start>;
  end: ZodSchema<Bitflow.End>;
  input: ZodSchema<Bitflow.Input>;
  title: ZodSchema<Bitflow.Title>;
  task: ZodSchema<Bitflow.Task>;
}) =>
  z.union([
    FlowSplitAnswerNodeSchema,
    FlowSplitResultNodeSchema,
    FlowSplitPointsNodeSchema,
    FlowSplitRandomNodeSchema,
    FlowPortalInputNodeSchema,
    FlowPortalOutputNodeSchema,
    makeFlowEndNodeSchema(end),
    makeFlowInputNodeSchema(input),
    makeFlowStartNodeSchema(start),
    makeFlowTaskNodeSchema(task),
    makeFlowTitleNodeSchema(title),
  ]);

export const makeFlowSchema = ({
  end,
  input,
  start,
  task,
  title,
}: {
  start: ZodSchema<Bitflow.Start>;
  end: ZodSchema<Bitflow.End>;
  input: ZodSchema<Bitflow.Input>;
  title: ZodSchema<Bitflow.Title>;
  task: ZodSchema<Bitflow.Task>;
}) =>
  z
    .object({
      name: z.string(),
      draft: z.boolean(),
      nodes: z.array(makeFlowNodeSchema({ start, end, input, title, task })),
      edges: z.array(FlowEdgeSchema),
      zoom: z.number().positive().default(1),
      position: z.tuple([z.number(), z.number()]).default([0, 0]),
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
