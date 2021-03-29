import { Box, BoxProps } from "@openpatch/patches";
import { FC } from "react";
import { Elements, ReactFlowProps } from "react-flow-renderer";
import { Flow } from "./Flow";
import { IFlow } from "./schemas";

export const FlowTeaser: FC<
  Pick<IFlow, "nodes" | "edges"> & {
    height?: BoxProps["height"];
    width?: BoxProps["width"];
  }
> = ({ nodes, edges, height = "100%", width = "100%" }) => {
  const onLoad: ReactFlowProps["onLoad"] = (reactFlowInstance) => {
    reactFlowInstance.fitView();
  };
  return (
    <Box height={height} width={width}>
      <Flow
        onLoad={onLoad}
        paneMoveable={false}
        nodesDraggable={false}
        zoomOnScroll={false}
        elements={[...nodes, ...edges] as Elements}
        nodesConnectable={false}
        hideUI={true}
      />
    </Box>
  );
};
