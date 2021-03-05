import { css } from "@emotion/react";
import { Markdown, Box, BoxProps } from "@openpatch/patches";
import { Check } from "@openpatch/patches/dist/cjs/icons/shade";
import { Feedback } from "./Feedback";
import { FC, KeyboardEvent } from "react";
import { IResult } from "./types";

export type ChoiceProps = {
  choice: string;
  checked: boolean;
  result?: IResult["choices"]["a"];
  onChange: (checked: boolean) => void;
};

export const Choice: FC<ChoiceProps> = ({
  choice,
  checked,
  onChange,
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
  switch (result?.state) {
    case "correct":
      backgroundColor = "success.200";
      break;
    case "wrong":
      backgroundColor = "error.200";
      break;
  }

  return (
    <Box>
      <Box
        role="checkbox"
        display="flex"
        padding="standard"
        backgroundColor={backgroundColor}
        borderRadius="standard"
        boxShadow="standard"
        aria-checked={checked}
        tabIndex={0}
        cursor="pointer"
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        css={(theme) => css`
          :focus {
            box-shadow: ${theme.shadows["outline"]};
          }
          user-select: none;
        `}
      >
        <Box
          width="24px"
          height="24px"
          backgroundColor="neutral.700"
          borderRadius="full"
          css={css`
            svg .primary {
              fill: transparent;
            }

            svg .secondary {
              fill: white;
            }
          `}
        >
          {checked && <Check />}
        </Box>
        <Box
          flex="1"
          css={css`
            p {
              margin: 0;
            }
          `}
          paddingLeft="xsmall"
        >
          <Markdown markdown={choice} />
        </Box>
      </Box>
      {result?.feedback && (
        <Box marginTop="xsmall" marginLeft="large">
          <Feedback {...result.feedback} />
        </Box>
      )}
    </Box>
  );
};
