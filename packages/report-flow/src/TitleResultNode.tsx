import { DoTry, FlowTitleNode } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { StatusFooter } from "./StatusFooter";

export type TitleResultNodeProps = {
  type: "title";
  data: FlowTitleNode["data"] & {
    result: {
      status: Record<DoTry["status"], number>;
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
