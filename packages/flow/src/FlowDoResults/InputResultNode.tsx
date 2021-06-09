import { InputBitsSchema } from "@bitflow/bits";
import * as z from "zod";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import { IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type InputResultNodeProps = IFlowNode & {
  type: "input";
  data: z.infer<typeof InputBitsSchema> & {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
      count: number;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const InputResultNode = ({ data, type }: InputResultNodeProps) => {
  const status = data.result.status;
  return (
    <FlowNode
      tone="blue"
      title={data.name || ""}
      description={data.description}
      footerLeft={type}
      footerRight={data.subtype}
      footerCenter={<StatusFooter status={status} />}
      targetHandles={1}
      sourceHandles={1}
    />
  );
};
