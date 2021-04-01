import { css } from "@emotion/react";
import { Box } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useCallback, useRef, useState } from "react";
import translations from "../locales.vocab";
import { ErrorsSidebar, ErrorsSidebarProps } from "./ErrorsSidebar";
import { NodesSidebar, NodesSidebarProps } from "./NodesSidebar";
import { PropertiesSidebar, PropertiesSidebarProps } from "./PropertiesSidebar";

type SidebarState = "nodes" | "properties" | "errors";

const SidebarLabel = ({
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

export type SidebarProps = PropertiesSidebarProps &
  ErrorsSidebarProps &
  NodesSidebarProps;

export const Sidebar: FC<SidebarProps> = (props: SidebarProps) => {
  const { t } = useTranslations(translations);
  const [state, setState] = useState<SidebarState>("nodes");
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(420);
  const resizeRef = useRef<HTMLDivElement>(null);

  let sidebar = null;
  if (state === "properties") {
    sidebar = <PropertiesSidebar {...props} />;
  } else if (state === "errors") {
    sidebar = <ErrorsSidebar {...props} />;
  } else if (state === "nodes") {
    sidebar = <NodesSidebar />;
  }

  const handleClick = (type: typeof state) => () => {
    if (type === state && open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
    setState(type);
  };

  const handleResize = useCallback(() => {
    function onMouseMove(e: MouseEvent) {
      setWidth((currentWidth) => Math.max(currentWidth - e.movementX, 200));
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <Box
      as="aside"
      position="absolute"
      right={open ? 0 : `${-width}px`}
      boxShadow="xlarge"
      top="0"
      bottom="0"
      width={`${width}px`}
      backgroundColor="card"
      zIndex="50"
      css={css`
        transition: right 0.5s cubic-bezier(0.82, 0.085, 0.395, 0.895);
      `}
    >
      <Box
        width="6px"
        backgroundColor="neutral.500"
        position="absolute"
        top={0}
        ref={resizeRef}
        bottom={0}
        left={0}
        zIndex="50"
        onMouseDown={handleResize}
        css={css`
          cursor: col-resize;
        `}
      ></Box>
      <SidebarLabel
        active={open && state === "nodes"}
        onClick={handleClick("nodes")}
        index={0}
      >
        {t("nodes")}
      </SidebarLabel>
      <SidebarLabel
        active={open && state === "properties"}
        onClick={handleClick("properties")}
        index={1}
      >
        {t("properties")}
      </SidebarLabel>
      {false && (
        <SidebarLabel
          active={open && state === "errors"}
          onClick={handleClick("errors")}
          index={2}
        >
          {t("errors")}
        </SidebarLabel>
      )}
      {sidebar}
    </Box>
  );
};
