import { FlowEdge, FlowNode, isInteractiveFlowNode } from "@bitflow/core";
import { Flow, FlowProps } from "@bitflow/flow";
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

export type ReportFlowProps = {
  nodes: (FlowNode | InteractiveFlowResultNode)[];
  edges: (FlowEdge & {
    type?: "correlation" | "default";
    data: {
      correlation?: number;
    };
  })[];
  onSelection?: (node: InteractiveFlowResultNode | null) => void;
};

export const ReportFlow = ({ nodes, edges, onSelection }: ReportFlowProps) => {
  const handleSelectionChange: FlowProps["onSelectionChange"] = (elements) => {
    const first = elements?.[0];
    if (first && isInteractiveFlowNode(first as any) && onSelection) {
      onSelection(first as InteractiveFlowResultNode);
    } else if (onSelection) {
      onSelection(null);
    }
  };

  return (
    <Flow
      autoFitView
      nodes={
        nodes.map((n) =>
          n.type === "portal-input" ||
          n.type === "portal-output" ||
          n.type.includes("split-")
            ? { ...n, data: { ...(n as any).data, disabled: true } }
            : n
        ) as FlowNode[]
      }
      edges={edges}
      minZoom={0.1}
      onlyRenderVisibleElements={false} /* might be a performace issue */
      onSelectionChange={handleSelectionChange}
      edgeTypes={
        {
          correlation: CorrelationEdge,
        } as any
      }
      nodeTypes={
        {
          title: TitleResultNode,
          input: InputResultNode,
          task: TaskResultNode,
          start: StartResultNode,
          end: EndResultNode,
          synchronize: SynchronizeResultNode,
          checkpoint: CheckpointResultNode,
        } as any
      }
    />
  );
};
