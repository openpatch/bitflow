import { Fragment } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  ReactFlowProps,
} from "react-flow-renderer";
import { Styles } from "../Styles";
import { LatentVariableNode } from "./LatentVariableNode";
import { ManifestTaskNode } from "./ManifestTaskNode";

export type FlowModelProps = {
  latentVariables: (Node & {
    type: "latent-variable";
    data: {
      title: string;
      alpha: number;
    };
  })[];
  nodes: (Node & {
    type: "manifest-task";
    data: {
      title: string;
      description: string;
      subtype: string;
    };
  })[];
  edges: Edge<{
    factorLoading: number;
  }>[];
} & Omit<ReactFlowProps, "elements">;

export const FlowModel = ({
  nodes = [],
  latentVariables = [],
  edges = [],
  ...props
}: FlowModelProps) => {
  const handleLoad: ReactFlowProps["onLoad"] = (flow) => {
    flow.fitView();
  };

  return (
    <Fragment>
      <Styles />
      <ReactFlow
        {...props}
        onLoad={handleLoad}
        elements={[...nodes, ...latentVariables, ...edges]}
        minZoom={0.1}
        onlyRenderVisibleElements={false}
        nodeTypes={{
          "manifest-task": ManifestTaskNode,
          "latent-variable": LatentVariableNode,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
        <Controls />
      </ReactFlow>
    </Fragment>
  );
};
