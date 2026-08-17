import { css } from "@emotion/react";
import { Box } from "@openpatch/patches";

export const SidebarLabel = ({
  active,
  onClick,
  index,
  children,
}: {
  active: boolean;
  onClick: () => void;
  index: number;
  children: string;
}) => (
  <Box
    position="absolute"
    left="-34px"
    cursor="pointer"
    display="flex"
    role="button"
    onClick={onClick}
    justifyContent="center"
    alignItems="center"
    padding="standard"
    width="120px"
    borderRadius="standard"
    borderBottomRightRadius="none"
    borderBottomLeftRadius="none"
    borderStyle="solid"
    borderColor={active ? "accent.300" : "neutral.300"}
    borderWidth="light"
    borderBottomStyle="hidden"
    height="20px"
    backgroundColor={active ? "accent.50" : "neutral.50"}
    textColor={active ? "accent.900" : "neutral.900"}
    css={css`
      top: calc(180px + ${index}*110px);
      user-select: none;
      transform-origin: 0 0;
      transform: rotate(-90deg);
    `}
  >
    {children}
  </Box>
);
