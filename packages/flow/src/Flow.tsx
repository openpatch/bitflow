import { Flow as IFlow } from "@bitflow/core";
import { FC, Fragment } from "react";
import ReactFlow, {
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

export type FlowProps = Pick<IFlow, "nodes" | "edges" | "zoom" | "position"> &
  Omit<ReactFlowProps, "elements" | "zoom" | "posititon"> & {
    autoFitView?: boolean;
    interactive?: boolean;
  };

export const Flow: FC<FlowProps> = ({
  interactive = true,
  autoFitView = false,
  nodes,
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
          {...props}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
          {interactive && <Controls />}
        </ReactFlow>
      </ReactFlowProvider>
    </Fragment>
  );
};
