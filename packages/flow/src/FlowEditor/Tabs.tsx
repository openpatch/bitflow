import { css } from "@emotion/react";
import { Box } from "@openpatch/patches";
import { FC } from "react";

export type TabProps = {
  onClick?: () => void;
  active?: boolean;
};
export const Tab: FC<TabProps> = ({ onClick, active, children }) => {
  return (
    <Box
      tabIndex={0}
      role="button"
      cursor="pointer"
      onClick={onClick}
      padding="standard"
      height="61px"
      marginRight="standard"
      backgroundColor={active ? "accent.50" : "transparent"}
    >
      {children}
    </Box>
  );
};

export type TabsProps = {};

export const Tabs: FC<TabsProps> = ({ children }) => (
  <Box
    display="flex"
    flexWrap="wrap"
    flexDirection="column"
    overflowX="auto"
    overflowY="hidden"
    height="61px"
    borderBottomColor="neutral.200"
    borderBottomStyle="solid"
    borderBottomWidth="standard"
    boxShadow="standard"
    fontWeight="bold"
  >
    {children}
  </Box>
);

export type TabPanel = {
  index: number;
  value: number;
};

export const TabPanel: FC<TabPanel> = ({ children, index, value }) => {
  if (index !== value) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top="70px"
      right="0"
      left="0"
      bottom="0"
      padding="standard"
      overflowY="auto"
      css={css`
        :after {
          content: "";
          display: block;
          height: 16px;
        }
      `}
    >
      {children}
    </Box>
  );
};
