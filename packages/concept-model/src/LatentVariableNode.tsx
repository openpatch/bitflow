import { round } from "@bitflow/stats";
import { css } from "@emotion/react";
import { CSSProperties } from "react";
import { Box, Text } from "@openpatch/patches";
import { Handle, Position } from "react-flow-renderer";

export type LatentVariableNodeProps = {
  data: {
    title: string;
    mean?: number;
    alpha?: number;
  };
  maxWidth: CSSProperties["maxWidth"];
  hideHandles: boolean;
};

export const LatentVariableNode = ({
  data,
  maxWidth = "200px",
  hideHandles = false,
}: LatentVariableNodeProps) => {
  const primaryTextColor = "#513c06";
  const secondaryTextColor = "#a27c1a";
  const primaryBackgroundColor = "#fffaeb";
  return (
    <Box
      borderRadius="full"
      boxShadow="standard"
      borderStyle="solid"
      borderWidth="light"
      padding="xsmall"
      css={css`
        max-width: ${maxWidth};
        cursor: grab;
        user-select: none;
        border-color: ${primaryTextColor};
        background-color: ${primaryBackgroundColor};
        color: ${primaryTextColor};
      `}
    >
      {!hideHandles && <Handle type="target" position={Position.Left} />}
      <Text textAlign="center" fontWeight="bold">
        {data.title}
      </Text>
      {data.mean && (
        <Text
          textAlign="center"
          fontSize="small"
          css={css`
            color: ${secondaryTextColor};
          `}
        >
          Avg Score: {round(data.mean)}
        </Text>
      )}
    </Box>
  );
};
