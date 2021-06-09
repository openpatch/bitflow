import { TitleBitsSchema } from "@bitflow/bits";
import * as z from "zod";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import { IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type TitleResultNodeProps = IFlowNode & {
  type: "title";
  data: z.infer<typeof TitleBitsSchema> & {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const TitleResultNode = ({ data, type }: TitleResultNodeProps) => {
  const status = data.result.status;
  return (
    <FlowNode
      tone="blue"
      title={data.name}
      description={data.description}
      footerLeft={type}
      footerRight={data.subtype}
      targetHandles={1}
      footerCenter={<StatusFooter status={status} />}
      sourceHandles={1}
    />
  );
};
