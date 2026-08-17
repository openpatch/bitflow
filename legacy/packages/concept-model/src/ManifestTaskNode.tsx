import { FlowNode } from "@bitflow/flow-node";

export type ManifestTaskNodeProps = {
  type: "task";
  data: {
    name: string;
    description: string;
    subtype: string;
  };
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
