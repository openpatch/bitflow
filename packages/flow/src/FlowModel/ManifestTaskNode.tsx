import { TaskBitsSchema } from "@bitflow/bits/dist/types";
import * as z from "zod";
import { FlowNode } from "../FlowNode";
import { IFlowNode } from "../schemas";

export type ManifestTaskNodeProps = IFlowNode & {
  type: "task";
  data: z.infer<typeof TaskBitsSchema> & {};
};

export const ManifestTaskNode = ({ type, data }: ManifestTaskNodeProps) => {
  return (
    <FlowNode
      tone="blue"
      title={data.name}
      description={data.description}
      footerRight={data.subtype}
      sourceHandles={1}
    />
  );
};
