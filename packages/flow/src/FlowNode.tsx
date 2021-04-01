import { css } from "@emotion/react";
import { Box, Text } from "@openpatch/patches";
import { CSSProperties, FC, ReactElement } from "react";
import { Handle, Position } from "react-flow-renderer";

const handleIds = ["a", "b", "c", "d"];

const handlePositions = [
  "50%",
  ["25%", "75%"],
  ["20%", "50%", "80%"],
  ["10%", "37%", "65%", "90%"], // looks visually better distributed
];

export type FlowNodeProps = {
  tone?:
    | "red"
    | "yellow"
    | "pink"
    | "purple"
    | "mint"
    | "teal"
    | "blue"
    | "grey"
    | "portalOrange"
    | "portalBlue";
  title: string;
  description?: string;
  footerRight?: string;
  footerLeft?: string;
  targetHandles?: number;
  maxWidth?: CSSProperties["maxWidth"];
  sourceHandles?: number;
  hideHandles?: boolean;
};

export const FlowNode: FC<FlowNodeProps> = ({
  tone = "grey",
  title,
  description,
  footerLeft,
  footerRight,
  targetHandles = 0,
  sourceHandles = 0,
  maxWidth,
  hideHandles,
}) => {
  let primaryTextColor: CSSProperties["color"];
  let secondaryTextColor: CSSProperties["color"];
  let primaryBackgroundColor: CSSProperties["backgroundColor"];
  let secondaryBackgroundColor: CSSProperties["backgroundColor"];

  switch (tone) {
    case "blue": {
      primaryTextColor = "#003e6b";
      secondaryTextColor = "#0f609b";
      primaryBackgroundColor = "#dceefb";
      secondaryBackgroundColor = "#b6e0fe";
      break;
    }
    case "mint": {
      primaryTextColor = "#3d663d";
      secondaryTextColor = "#7acc7a";
      primaryBackgroundColor = "#eaffea";
      secondaryBackgroundColor = "#d6ffd6";
      break;
    }
    case "teal": {
      primaryTextColor = "#014d40";
      secondaryTextColor = "#147d64";
      primaryBackgroundColor = "#effcf6";
      secondaryBackgroundColor = "#c6f7e2";
      break;
    }
    case "pink": {
      primaryTextColor = "#620042";
      secondaryTextColor = "#a30664";
      primaryBackgroundColor = "#ffe3ec";
      secondaryBackgroundColor = "#ffb8d2";
      break;
    }
    case "purple": {
      primaryTextColor = "#240754";
      secondaryTextColor = "#421987";
      primaryBackgroundColor = "#eae2f8";
      secondaryBackgroundColor = "#cfbcf2";
      break;
    }
    case "red": {
      primaryTextColor = "#610404";
      secondaryTextColor = "#911111";
      primaryBackgroundColor = "#ffeeee";
      secondaryBackgroundColor = "#facdcd";
      break;
    }
    case "yellow": {
      primaryTextColor = "#513c06";
      secondaryTextColor = "#a27c1a";
      primaryBackgroundColor = "#fffaeb";
      secondaryBackgroundColor = "#fcefc7";
      break;
    }
    case "grey": {
      primaryTextColor = "#1f2933";
      secondaryTextColor = "#3e4c59";
      primaryBackgroundColor = "#f5f7fa";
      secondaryBackgroundColor = "#e4e7eb";
      break;
    }
    case "portalBlue": {
      primaryTextColor = "#034ABD";
      secondaryTextColor = "#045EE0";
      primaryBackgroundColor = "#E6FCFF";
      secondaryBackgroundColor = "#CEF9FF";
      break;
    }
    case "portalOrange": {
      primaryTextColor = "#B15608";
      secondaryTextColor = "#E97008";
      primaryBackgroundColor = "#FFF9E6";
      secondaryBackgroundColor = "#FFF4CD";
      break;
    }
  }

  const handles: ReactElement[] = [];

  if (!hideHandles) {
    for (let i = 0; i < sourceHandles; i++) {
      handles.push(
        <Handle
          key={`source_${handleIds[i]}`}
          type="source"
          id={handleIds[i]}
          position={Position.Right}
          style={{
            top: handlePositions[sourceHandles - 1][i],
          }}
        />
      );
    }

    for (let i = 0; i < targetHandles; i++) {
      handles.push(
        <Handle
          key={`target_${handleIds[i]}`}
          type="target"
          id={handleIds[i]}
          position={Position.Left}
          style={{
            top: handlePositions[targetHandles - 1][i],
          }}
        />
      );
    }
  }

  return (
    <Box
      maxWidth="300px"
      boxShadow="standard"
      borderRadius="standard"
      borderStyle="solid"
      borderWidth="light"
      padding="xsmall"
      css={css`
        cursor: grab;
        user-select: none;
        max-width: ${maxWidth};
        border-color: ${primaryTextColor};
        background-color: ${primaryBackgroundColor};
        color: ${primaryTextColor};
      `}
    >
      <Text textAlign="center" fontWeight="bold">
        {title}
      </Text>
      {handles}
      {description && (
        <Text
          fontSize="small"
          css={css`
            color: ${secondaryTextColor};
          `}
        >
          {description}
        </Text>
      )}
      {(footerLeft || footerRight) && (
        <Box
          css={css`
            margin-left: -8px;
            margin-right: -8px;
            margin-bottom: -8px;
            color: ${secondaryTextColor};
            border-top-color: ${primaryTextColor};
            background-color: ${secondaryBackgroundColor};
          `}
          marginTop="xsmall"
          borderBottomLeftRadius="standard"
          borderBottomRightRadius="standard"
          borderTopStyle="solid"
          borderTopWidth="light"
          padding="xxsmall"
          display="flex"
          justifyContent="space-between"
        >
          <Text fontSize="small" mr="xsmall">
            {footerLeft}
          </Text>
          <Text fontSize="small">{footerRight}</Text>
        </Box>
      )}
    </Box>
  );
};
