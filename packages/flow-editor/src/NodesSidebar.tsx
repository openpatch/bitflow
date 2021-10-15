import {
  FlowNode,
  PortalInput,
  PortalOutput,
  SplitAnswer,
  SplitPoints,
  SplitResult,
} from "@bitflow/core";
import {
  BitNode,
  CheckpointNode,
  PortalInputNode,
  PortalOutputNode,
  SplitAnswerNode,
  SplitPointsNode,
  SplitRandomNode,
  SplitResultNode,
  SynchronizeNode,
} from "@bitflow/flow";
import { useBits } from "@bitflow/provider";
import { AutoGrid, Box, Heading } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { DragEvent, Fragment } from "react";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export type NodesSidebarProps = {};

type BitNodesProps = {
  type: "start" | "end" | "input" | "task" | "title";
  onDragStart: (
    e: DragEvent<HTMLDivElement>,
    type: BitNodesProps["type"],
    node: unknown
  ) => void;
};
const BitNodes = ({ onDragStart, type }: BitNodesProps) => {
  const { t } = useTranslations(translations);
  const bits = useBits(type as "task");

  return (
    <Fragment>
      <Heading as="h2" fontSize="standard">
        {t(type)}
      </Heading>
      {Object.entries(bits).map(([subtype, bit]) => {
        const { example, name, description } = bit.useInformation();

        return (
          <Box
            key={`${type}-${subtype}`}
            onDragStart={(e) => onDragStart(e, type, example)}
            draggable
          >
            <BitNode
              type={type}
              hideHandles
              maxWidth="100%"
              data={{
                name,
                description,
                subtype,
              }}
            />
          </Box>
        );
      })}
    </Fragment>
  );
};

export const NodesSidebar = ({}: NodesSidebarProps) => {
  const { t } = useTranslations(translations);
  const onDragStart = <T,>(
    event: DragEvent<HTMLDivElement>,
    type: FlowNode["type"],
    data: T
  ) => {
    event.dataTransfer.setData(
      "application/bitflow-node",
      JSON.stringify({ type, data })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <HeaderSidebar header={t("nodes")}>
      <AutoGrid gap="standard">
        <BitNodes onDragStart={onDragStart} type="start" />
        <BitNodes onDragStart={onDragStart} type="end" />
        <BitNodes onDragStart={onDragStart} type="task" />
        <BitNodes onDragStart={onDragStart} type="title" />
        <BitNodes onDragStart={onDragStart} type="title" />
        <Heading as="h2" fontSize="standard">
          {t("control")}
        </Heading>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "checkpoint", null)}
          draggable
        >
          <CheckpointNode maxWidth="100%" hideHandles />
        </Box>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "synchronize", null)}
          draggable
        >
          <SynchronizeNode maxWidth="100%" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<SplitAnswer>(e, "split-answer", {
              condition: {
                type: "true",
                not: false,
                nodeId: "",
                key: "",
              },
            })
          }
          draggable
        >
          <SplitAnswerNode maxWidth="100%" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<SplitPoints>(e, "split-points", {
              points: 1,
            })
          }
          draggable
        >
          <SplitPointsNode maxWidth="100%" hideHandles />
        </Box>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "split-random", null)}
          draggable
        >
          <SplitRandomNode maxWidth="100%" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<SplitResult>(e, "split-result", {
              condition: {
                type: "true",
                not: false,
                nodeId: "",
                key: "",
              },
            })
          }
          draggable
        >
          <SplitResultNode maxWidth="100%" hideHandles />
        </Box>
        <Heading as="h2" fontSize="standard">
          {t("utility")}
        </Heading>
        <Box
          onDragStart={(e) =>
            onDragStart<PortalInput>(e, "portal-input", {
              portal: "a",
              description: "",
            })
          }
          draggable
        >
          <PortalInputNode
            maxWidth="100%"
            hideHandles
            data={{
              description: t("portal-helper-text"),
              portal: t("portal"),
            }}
          />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<PortalOutput>(e, "portal-output", {
              portal: "a",
              description: "",
            })
          }
          draggable
        >
          <PortalOutputNode
            maxWidth="100%"
            hideHandles
            data={{
              description: t("portal-helper-text"),
              portal: t("portal"),
            }}
          />
        </Box>
      </AutoGrid>
    </HeaderSidebar>
  );
};
