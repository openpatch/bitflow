import { ButtonPrimary, Box } from "@openpatch/patches";
import { Title, TitleProps } from "@openpatch/bits-base";
import { FC } from "react";
import { IShell } from "./types";
import { css } from "@emotion/react";

export type TitleShellProps<P extends Title> = {
  title: P;
  TitleComponent: FC<TitleProps<P>>;
  locales?: {
    start: string;
    welcome: string;
  };
} & IShell;

export const TitleShell = <P extends Title>({
  title,
  TitleComponent,
  locales = {
    start: "Start",
    welcome: "Welcome",
  },
  onNext,
}: TitleShellProps<P>) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      height="100vh"
    >
      <TitleComponent title={title} />
      <Box
        padding="standard"
        css={css`
          button {
            height: 40px;
          }
        `}
      >
        <ButtonPrimary fullWidth onClick={onNext}>
          {locales.start}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};
