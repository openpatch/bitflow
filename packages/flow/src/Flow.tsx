// @ts-nocheck
import { Flow as IFlow } from "@bitflow/core";
import { FC, Fragment } from "react";
import ReactFlowRenderer, {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProps,
  ReactFlowProvider,
} from "react-flow-renderer";
import { BitNode } from "./BitNode";
import { CheckpointNode } from "./CheckpointNode";
import { PortalInputNode } from "./PortalInputNode";
import { PortalOutputNode } from "./PortalOutputNode";
import { SplitAnswerNode } from "./SplitAnswerNode";
import { SplitPointsNode } from "./SplitPointsNode";
import { SplitRandomNode } from "./SplitRandomNode";
import { SplitResultNode } from "./SplitResultNode";
import { Styles } from "./Styles";
import { SynchronizeNode } from "./SynchronizeNode";

// see https://github.com/emotion-js/emotion/issues/2582
const anyReactFlow: any = ReactFlowRenderer;
export const ReactFlow: typeof ReactFlowRenderer =
  "default" in ReactFlowRenderer ? anyReactFlow.default : ReactFlowRenderer;

export type FlowProps = Pick<IFlow, "nodes" | "edges" | "zoom" | "position"> &
  Omit<ReactFlowProps, "elements" | "zoom" | "posititon" | "css"> & {
    autoFitView?: boolean;
    interactive?: boolean;
    draft?: boolean;
  };

export const Flow: FC<FlowProps> = ({
  interactive = true,
  autoFitView = false,
  nodes,
  draft,
  edges,
  zoom,
  position,
  nodeTypes,
  onLoad,
  ...props
}) => {
  const handleLoad: ReactFlowProps["onLoad"] = (reactFlowInstance) => {
    if (autoFitView) {
      reactFlowInstance.fitView({ padding: 0.25, includeHiddenNodes: true });
    }
    if (onLoad) {
      onLoad(reactFlowInstance);
    }
  };

  return (
    <Fragment>
      <Styles />
      <ReactFlowProvider>
        <ReactFlow
          {...props}
          minZoom={0.5}
          onLoad={handleLoad}
          deleteKeyCode={46} /* 'delete'-key */
          onlyRenderVisibleElements={false} /* might be an performace issue */
          nodeTypes={{
            title: BitNode,
            input: BitNode,
            task: BitNode,
            start: BitNode,
            end: BitNode,
            synchronize: SynchronizeNode,
            "portal-input": PortalInputNode,
            "portal-output": PortalOutputNode,
            checkpoint: CheckpointNode,
            "split-random": SplitRandomNode,
            "split-points": SplitPointsNode,
            "split-answer": SplitAnswerNode,
            "split-result": SplitResultNode,
            ...nodeTypes,
          }}
          paneMoveable={interactive}
          nodesDraggable={interactive}
          nodesConnectable={interactive}
          zoomOnScroll={interactive}
          elements={[...nodes, ...edges]}
          defaultZoom={zoom}
          defaultPosition={position}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
          {interactive && <Controls />}
        </ReactFlow>
      </ReactFlowProvider>
    </Fragment>
  );
};
