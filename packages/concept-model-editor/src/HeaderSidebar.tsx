import { css } from "@emotion/react";
import { Box, Text } from "@openpatch/patches";
import { FC, Fragment } from "react";

export type HeaderSidebarProps = {
  header: string;
};

export const HeaderSidebar: FC<HeaderSidebarProps> = ({ header, children }) => (
  <Fragment>
    <Box
      padding="standard"
      borderBottomColor="neutral.200"
      borderBottomStyle="solid"
      borderBottomWidth="standard"
      boxShadow="standard"
      height="58px"
      fontWeight="bold"
    >
      <Text>{header}</Text>
    </Box>
    <Box
      position="absolute"
      top="56px"
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
  </Fragment>
);
