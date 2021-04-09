import { css } from "@emotion/react";
import { Box, BoxProps, Heading, Icon, LoadingDots } from "@openpatch/patches";
import { Close } from "@openpatch/patches/dist/cjs/icons/shade";
import { ChevronLeft } from "@openpatch/patches/dist/cjs/icons/solid";
import { useTranslations } from "@vocab/react";
import { FC, ReactNode } from "react";
import translations from "./locales.vocab";
import { Progress } from "./Progress";

export type ShellProps = {
  children: ReactNode;
  noHeader?: boolean;
};

export const Shell: FC<ShellProps> = ({ children, noHeader }) => {
  return (
    <Box
      css={[
        css`
          display: grid;
          grid-template-rows: 60px 1fr auto;
        `,
        noHeader &&
          css`
            grid-template-rows: 1fr auto;
          `,
      ]}
      top="0"
      bottom="0"
      left="0"
      right="0"
      position="absolute"
      overflow="hidden"
    >
      {children}
    </Box>
  );
};

export type ShellHeaderProps = {
  disabled?: boolean;
  loadingPrevious?: boolean;
  loadingClose?: boolean;
  onClose?: () => void;
  onPrevious?: () => void;
  children: ReactNode;
  progress?: {
    value: number;
    max: number;
  };
};

export const ShellHeader: FC<ShellHeaderProps> = ({
  onClose,
  onPrevious,
  loadingClose,
  loadingPrevious,
  children,
  disabled,
  progress,
}) => {
  const { t } = useTranslations(translations);

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
      {onPrevious && (
        <Box
          position="absolute"
          left="standard"
          role="button"
          onClick={disabled ? undefined : onPrevious}
          title={t("previous")}
          fontSize="xlarge"
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
          css={
            disabled &&
            css`
              opacity: 0.5;
            `
          }
        >
          {!loadingPrevious ? (
            <Icon color="currentColor" size="auto">
              <ChevronLeft />
            </Icon>
          ) : (
            <LoadingDots />
          )}
        </Box>
      )}
      <Heading fontSize="small">{children}</Heading>
      {onClose && (
        <Box
          position="absolute"
          right="standard"
          role="button"
          onClick={disabled ? undefined : onClose}
          title={t("close")}
          fontSize="xlarge"
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
          css={
            disabled &&
            css`
              opacity: 0.5;
            `
          }
        >
          {!loadingClose ? (
            <Icon color="currentColor" size="auto">
              <Close />
            </Icon>
          ) : (
            <LoadingDots />
          )}
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
