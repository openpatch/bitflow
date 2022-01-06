import { Styles } from "@bitflow/flow";
import { Fragment } from "react";
import ReactFlowRenderer, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  ReactFlowProps,
} from "react-flow-renderer";
import { LatentVariableNode } from "./LatentVariableNode";
import { ManifestTaskNode } from "./ManifestTaskNode";

// see https://github.com/emotion-js/emotion/issues/2582
const anyReactFlow: any = ReactFlowRenderer;
export const ReactFlow: typeof ReactFlowRenderer =
  "default" in ReactFlowRenderer ? anyReactFlow.default : ReactFlowRenderer;

export type ConceptModelProps = {
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

export const ConceptModel = ({
  nodes = [],
  latentVariables = [],
  edges = [],
  onLoad,
  ...props
}: ConceptModelProps) => {
  const handleLoad: ReactFlowProps["onLoad"] = (flow) => {
    flow.fitView();
    if (onLoad) {
      onLoad(flow);
    }
  };

  return (
    <Fragment>
      <Styles />
      <ReactFlow
        onLoad={handleLoad}
        elements={[...nodes, ...latentVariables, ...edges]}
        minZoom={0.5}
        onlyRenderVisibleElements={false}
        nodeTypes={{
          "manifest-task": ManifestTaskNode,
          "latent-variable": LatentVariableNode,
        }}
        {...props}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
        <Controls />
      </ReactFlow>
    </Fragment>
  );
};
