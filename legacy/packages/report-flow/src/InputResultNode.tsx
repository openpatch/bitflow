import { DoTry, FlowInputNode } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { StatusFooter } from "./StatusFooter";

export type InputResultNodeProps = {
  type: "input";
  data: FlowInputNode["data"] & {
    result: {
      status: Record<DoTry["status"], number>;
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
