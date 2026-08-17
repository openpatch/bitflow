import { css } from "@emotion/react";
import { Box } from "@openpatch/patches";
import { PropsWithChildren } from "react";

export type TabContainerProps = PropsWithChildren<{}>;

export const TabContainer = ({ children }: TabContainerProps) => {
  return (
    <Box
      position="absolute"
      top="60px"
      right="0"
      left="0"
      bottom="0"
      padding="standard"
      paddingTop="none"
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
