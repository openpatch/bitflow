import { AutoGrid, Box } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { DragEvent } from "react";
import { HeaderSidebar } from "../FlowEditor/HeaderSidebar";
import {
  LatentVariableNode,
  LatentVariableNodeProps,
} from "../FlowModel/LatentVariableNode";
import translations from "../locales.vocab";

export type NodesSidebarProps = {};

export const NodesSidebar = ({}: NodesSidebarProps) => {
  const { t } = useTranslations(translations);
  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    type: "latent-variable",
    data: LatentVariableNodeProps["data"]
  ) => {
    event.dataTransfer.setData(
      "application/bits-model-node",
      JSON.stringify({ type, data })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <HeaderSidebar header={t("nodes")}>
      <AutoGrid gap="standard">
        <Box
          onDragStart={(e) =>
            onDragStart(e, "latent-variable", {
              title: "Concept",
            })
          }
          draggable
        >
          <LatentVariableNode
            maxWidth="100%"
            hideHandles
            data={{
              title: "Concept",
            }}
          />
        </Box>
      </AutoGrid>
    </HeaderSidebar>
  );
};
