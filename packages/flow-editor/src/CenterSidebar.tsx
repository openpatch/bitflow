import { Box } from "@openpatch/patches";
import { FC, PropsWithChildren } from "react";

export type CenterSidebarProps = {};

export const CenterSidebar: FC<PropsWithChildren<CenterSidebarProps>> = ({
  children,
}) => {
  return (
    <Box
      position="absolute"
      top="0"
      bottom="0"
      right="0"
      left="0"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
};
