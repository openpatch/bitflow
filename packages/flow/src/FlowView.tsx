import { Box, BoxProps } from "@openpatch/patches";
import { FC } from "react";
import { Elements } from "react-flow-renderer";
import { Flow } from "./Flow";
import { IFlow } from "./schemas";

export const FlowView: FC<IFlow & { height?: BoxProps["height"] }> = ({
  name,
  nodes,
  edges,
  zoom,
  position,
  height = "100%",
}) => {
  return (
    <Box height={height}>
      <Flow
        elements={[...nodes, ...edges] as Elements}
        nodesConnectable={false}
        defaultZoom={zoom}
        defaultPosition={position}
      />
    </Box>
  );
};
