import { css, Theme } from "@emotion/react";
import { Box, BoxProps } from "@openpatch/patches";
import { FC } from "react";

type Level = 1 | 2 | 3 | 4 | 5;

export type ConfidenceProps = {
  level: Level;
  onClick?: () => void;
  checked?: boolean;
};

export const Confidence: FC<ConfidenceProps> = ({
  level,
  onClick,
  checked,
}) => {
  let backgroundColor: BoxProps["backgroundColor"];
  let textColor: BoxProps["textColor"];
  switch (level) {
    case 1:
      backgroundColor = "error.100";
      textColor = "error.900";
      break;
    case 2:
      backgroundColor = "error.50";
      textColor = "error.600";
      break;
    case 3:
      backgroundColor = "warning.50";
      textColor = "warning.600";
      break;
    case 4:
      backgroundColor = "success.50";
      textColor = "success.600";
      break;
    case 5:
      backgroundColor = "success.100";
      textColor = "success.900";
      break;
  }

  function handleClick() {
    if (onClick) {
      onClick();
    }
  }

  return (
    <Box
      borderRadius="full"
      height="40px"
      width="40px"
      display="flex"
      role="radio"
      onClick={handleClick}
      aria-checked={checked}
      cursor="pointer"
      tabIndex={level === 1 ? 0 : -1}
      css={
        !checked &&
        css`
          opacity: 0.3;
        `
      }
      alignItems="center"
      justifyContent="center"
      borderColor={textColor}
      borderStyle="solid"
      borderWidth="medium"
      backgroundColor={backgroundColor}
      textColor={textColor}
      fontWeight="bold"
    >
      {level}
    </Box>
  );
};

export type ConfidenceLevelsProps = {
  onClick: (level: Level) => void;
  value?: Level;
};

export const ConfidenceLevels: FC<ConfidenceLevelsProps> = ({
  onClick,
  value,
}) => {
  const handleClick = (level: Level) => () => {
    onClick(level);
  };
  return (
    <Box
      role="radiogroup"
      display="flex"
      justifyContent="space-around"
      maxWidth="small"
      marginX="auto"
      alignItems="center"
      css={(theme: Theme) => css`
        > div {
          margin: ${theme.space.standard};
        }
      `}
    >
      <Confidence level={1} checked={value === 1} onClick={handleClick(1)} />
      <Confidence level={2} checked={value === 2} onClick={handleClick(2)} />
      <Confidence level={3} checked={value === 3} onClick={handleClick(3)} />
      <Confidence level={4} checked={value === 4} onClick={handleClick(4)} />
      <Confidence level={5} checked={value === 5} onClick={handleClick(5)} />
    </Box>
  );
};
