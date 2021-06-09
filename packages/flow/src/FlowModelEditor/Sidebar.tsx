import { css } from "@emotion/react";
import { Box } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useCallback, useRef, useState } from "react";
import { SidebarLabel } from "../FlowEditor/SidebarLabel";
import translations from "../locales.vocab";
import { NodesSidebar, NodesSidebarProps } from "./NodesSidebar";
import { PropertiesSidebar, PropertiesSidebarProps } from "./PropertiesSidebar";

type SidebarState = "nodes" | "properties";

export type SidebarProps = NodesSidebarProps & PropertiesSidebarProps;

export const Sidebar: FC<SidebarProps> = (props: SidebarProps) => {
  const { t } = useTranslations(translations);
  const [state, setState] = useState<SidebarState>("nodes");
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(420);
  const resizeRef = useRef<HTMLDivElement>(null);

  let sidebar = null;
  if (state === "properties") {
    sidebar = <PropertiesSidebar {...props} />;
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
      {props.node && (
        <SidebarLabel
          active={open && state === "properties"}
          onClick={handleClick("properties")}
          index={1}
        >
          {t("properties")}
        </SidebarLabel>
      )}
      {sidebar}
    </Box>
  );
};
