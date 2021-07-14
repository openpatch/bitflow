import { css } from "@emotion/react";
import { Box, BoxProps, Theme } from "@openpatch/patches";
import { FC, KeyboardEvent } from "react";
import { IResult } from "./types";

export type OptionProps = {
  onChange: (checked: boolean) => void;
  checked: boolean;
  result?: IResult;
};

export const Option: FC<OptionProps> = ({
  onChange,
  checked,
  children,
  result,
}) => {
  function handleClick() {
    onChange(!checked);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === " ") {
      onChange(!checked);
      e.stopPropagation();
      e.preventDefault();
    }
  }

  let backgroundColor: BoxProps["backgroundColor"] = "neutral.100";
  if (checked) {
    switch (result?.state) {
      case "correct":
        backgroundColor = "success.200";
        break;
      case "wrong":
        backgroundColor = "error.200";
        break;
    }
    backgroundColor = "neutral.200";
  }

  return (
    <Box
      role="checkbox"
      display="flex"
      padding="standard"
      backgroundColor={backgroundColor}
      borderRadius="standard"
      boxShadow="standard"
      justifyContent="center"
      aria-checked={checked}
      tabIndex={0}
      cursor="pointer"
      onKeyDown={handleKeyDown}
      fontSize="large"
      onClick={handleClick}
      css={(theme: Theme) => css`
        :focus {
          box-shadow: ${theme.shadows["outline"]};
        }
        user-select: none;
      `}
    >
      {children}
    </Box>
  );
};
