import { css, Global, useTheme } from "@emotion/react";
import { FC, Fragment } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProps,
  ReactFlowProvider,
} from "react-flow-renderer";
import { BitNode } from "./BitNode";
import { CheckpointNode } from "./CheckpointNode";
import { EndNode } from "./EndNode";
import { SplitAnswerNode } from "./SplitAnswerNode";
import { SplitPointsNode } from "./SplitPointsNode";
import { SplitRandomNode } from "./SplitRandomNode";
import { SplitResultNode } from "./SplitResultNode";
import { StartNode } from "./StartNode";
import { SynchronizeNode } from "./SynchronizeNode";

export const Flow: FC<ReactFlowProps & { hideUI?: boolean }> = ({
  hideUI,
  ...props
}) => {
  const theme = useTheme();
  return (
    <Fragment>
      <Global
        styles={(theme) => css`
          .react-flow__handle-left {
            left: -10px !important;
          }
          .react-flow__node.selected {
            box-shadow: ${theme.shadows.outline}!important;
            border-radius: ${theme.radii.standard}!important;
          }
          .react-flow__edge-path,
          .react-flow__connection-path {
            stroke-width: 4 !important;
            stroke: ${theme.colors.neutral[300]}!important;
          }
          .react-flow__edge.selected .react-flow__edge-path {
            stroke: ${theme.colors.neutral[900]}!important;
          }
          .react-flow__handle-right {
            right: -10px !important;
          }
          .react-flow__handle {
            width: 12px !important;
            height: 12px !important;
            background-color: ${theme.colors.neutral[100]}!important;
            border: 2px solid ${theme.colors.neutral[900]}!important;
            border-radius: ${theme.radii.small}!important;
          }
          .react-flow__minimap {
            border: 2px solid ${theme.colors.neutral[400]}!important;
            border-radius: ${theme.radii.small}!important;
            box-shadow: ${theme.shadows.standard}!important;
          }
        `}
      ></Global>
      <ReactFlowProvider>
        <ReactFlow
          {...props}
          minZoom={0.1}
          deleteKeyCode={46} /* 'delete'-key */
          onlyRenderVisibleElements={false} /* might be an performace issue */
          nodeTypes={{
            title: BitNode,
            input: BitNode,
            task: BitNode,
            start: StartNode,
            end: EndNode,
            synchronize: SynchronizeNode,
            checkpoint: CheckpointNode,
            "split-random": SplitRandomNode,
            "split-points": SplitPointsNode,
            "split-answer": SplitAnswerNode,
            "split-result": SplitResultNode,
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
          {!hideUI && (
            <Fragment>
              <Controls />
              {false && (
                <MiniMap
                  nodeStrokeWidth={0}
                  nodeBorderRadius={16}
                  nodeColor={(node) => {
                    switch (node.type) {
                      case "bit":
                        return theme.colors.info["200"];
                      case "start":
                        return theme.colors.success["200"];
                      case "end":
                        return theme.colors.error["200"];
                      case "synchronize":
                      case "checkpoint":
                        return theme.colors.accent["200"];
                      default:
                        return theme.colors.warning["200"];
                    }
                  }}
                />
              )}
            </Fragment>
          )}
        </ReactFlow>
      </ReactFlowProvider>
    </Fragment>
  );
};
