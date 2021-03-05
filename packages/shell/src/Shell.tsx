import { FC, ReactNode } from "react";
import { Box, BoxProps, Heading, Icon } from "@openpatch/patches";
import { Close } from "@openpatch/patches/dist/cjs/icons/shade";
import { css } from "@emotion/react";
import { Progress } from "./Progress";

export type ShellProps = {
  children: ReactNode;
};

export const Shell: FC<ShellProps> = ({ children }) => {
  return (
    <Box
      css={css`
        display: grid;
        grid-template-rows: 60px 1fr auto;
      `}
      height="100vh"
      width="100wh"
      position="relative"
    >
      {children}
    </Box>
  );
};

export type ShellHeaderProps = {
  onClose?: () => void;
  children: ReactNode;
  progress?: {
    value: number;
    max: number;
  };
};

export const ShellHeader: FC<ShellHeaderProps> = ({
  onClose,
  children,
  progress,
}) => {
  return (
    <Box
      zIndex="10"
      boxShadow="standard"
      padding="standard"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position="relative"
    >
      <Heading fontSize="small">{children}</Heading>
      {onClose && (
        <Box
          position="absolute"
          right="standard"
          role="button"
          onClick={onClose}
          fontSize="xlarge"
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon color="text" size="auto">
            <Close />
          </Icon>
        </Box>
      )}
      {progress && (
        <Box position="absolute" left="0" right="0" bottom="0">
          <Progress {...progress} />
        </Box>
      )}
    </Box>
  );
};

export type ShellContentProps = {
  children?: ReactNode;
} & Pick<
  BoxProps,
  | "padding"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingRight"
  | "paddingTop"
  | "paddingX"
  | "paddingY"
  | "p"
  | "pb"
  | "pt"
  | "pr"
  | "pl"
  | "px"
  | "py"
>;

export const ShellContent: FC<ShellContentProps> = ({ children, ...props }) => {
  return (
    <Box overflow="auto" zIndex="0" {...props}>
      {children}
    </Box>
  );
};

export type ShellFooterProps = {
  children?: ReactNode;
};

export const ShellFooter: FC<ShellFooterProps> = ({ children }) => {
  return (
    <Box
      zIndex="10"
      display="flex"
      boxShadow="standard"
      padding="xsmall"
      css={css`
        button {
          height: 40px;
        }
      `}
    >
      {children}
    </Box>
  );
};
