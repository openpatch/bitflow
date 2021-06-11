import React, { Fragment, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Elements,
  isNode,
  ReactFlowProps,
  ReactFlowProvider,
} from "react-flow-renderer";
import { PortalInputNode } from "../PortalInputNode";
import { PortalOutputNode } from "../PortalOutputNode";
import { IFlowEdge, IFlowNode, InteractiveFlowNodeType } from "../schemas";
import { SplitAnswerNode } from "../SplitAnswerNode";
import { SplitPointsNode } from "../SplitPointsNode";
import { SplitRandomNode } from "../SplitRandomNode";
import { SplitResultNode } from "../SplitResultNode";
import { Styles } from "../Styles";
import {
  CheckpointResultNode,
  CheckpointResultNodeProps,
} from "./CheckpointResultNode";
import { CorrelationEdge } from "./CorrelationEdge";
import { EndResultNode, EndResultNodeProps } from "./EndResultNode";
import { InputResultNode, InputResultNodeProps } from "./InputResultNode";
import { StartResultNode, StartResultNodeProps } from "./StartResultNode";
import {
  SynchronizeResultNode,
  SynchronizeResultNodeProps,
} from "./SynchronizeResultNode";
import { TaskResultNode, TaskResultNodeProps } from "./TaskResultNode";
import { TitleResultNode, TitleResultNodeProps } from "./TitleResultNode";

export type InteractiveFlowResultNode =
  | CheckpointResultNodeProps
  | EndResultNodeProps
  | InputResultNodeProps
  | StartResultNodeProps
  | SynchronizeResultNodeProps
  | TaskResultNodeProps
  | TitleResultNodeProps;

export type FlowDoResultsProps = {
  hideUI?: boolean;
  nodes: (IFlowNode &
    (
      | {
          type: Exclude<IFlowNode["type"], InteractiveFlowNodeType>;
        }
      | InteractiveFlowResultNode
    ))[];
  edges: (IFlowEdge & {
    type?: "correlation" | "default";
    data: {
      correlation?: number;
    };
  })[];
  onSelection?: (node: FlowDoResultsProps["nodes"][0] | null) => void;
};

export const FlowDoResults = ({
  hideUI,
  nodes,
  edges,
  onSelection,
}: FlowDoResultsProps) => {
  const [isClient, setIsClient] = useState(false);

  const handleSelectionChange: ReactFlowProps["onSelectionChange"] = (
    elements
  ) => {
    const first = elements?.[0];
    if (first && isNode(first) && onSelection) {
      onSelection(first as any);
    } else if (onSelection) {
      onSelection(null);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLoad: ReactFlowProps["onLoad"] = (flow) => {
    flow.fitView();
  };

  return (
    <Fragment>
      <Styles />
      <ReactFlowProvider>
        <ReactFlow
          onLoad={handleLoad}
          elements={
            [
              ...nodes.map((n) =>
                n.type === "portal-input" ||
                n.type === "portal-output" ||
                n.type.includes("split-")
                  ? { ...n, data: { ...(n as any).data, disabled: true } }
                  : n
              ),
              ...edges.map((e) => ({
                ...e,
              })),
            ] as Elements
          }
          minZoom={0.1}
          onlyRenderVisibleElements={false} /* might be a performace issue */
          onSelectionChange={handleSelectionChange}
          edgeTypes={{
            correlation: CorrelationEdge,
          }}
          nodeTypes={{
            title: TitleResultNode,
            input: InputResultNode,
            task: TaskResultNode,
            start: StartResultNode,
            end: EndResultNode,
            synchronize: SynchronizeResultNode,
            "portal-input": PortalInputNode,
            "portal-output": PortalOutputNode,
            checkpoint: CheckpointResultNode,
            "split-random": SplitRandomNode,
            "split-points": SplitPointsNode,
            "split-answer": SplitAnswerNode,
            "split-result": SplitResultNode,
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
          {!hideUI && isClient && <Controls />}
        </ReactFlow>
      </ReactFlowProvider>
    </Fragment>
  );
};
