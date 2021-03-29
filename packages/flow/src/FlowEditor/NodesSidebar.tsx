import { IInput as IInputMarkdown } from "@bitflow/input-markdown";
import { ITask as ITaskChoice } from "@bitflow/task-choice";
import { ITask as ITaskFillInTheBlank } from "@bitflow/task-fill-in-the-blank";
import { ITask as ITaskInput } from "@bitflow/task-input";
import { ITitle as ITitleSimple } from "@bitflow/title-simple";
import { AutoGrid, Box, Heading } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { DragEvent } from "react";
import { BitNode } from "../BitNode";
import { CheckpointNode } from "../CheckpointNode";
import translations from "../locales.vocab";
import {
  IFlowNode,
  ISplitAnswer,
  ISplitPoints,
  ISplitResult,
} from "../schemas";
import { SplitAnswerNode } from "../SplitAnswerNode";
import { SplitPointsNode } from "../SplitPointsNode";
import { SplitRandomNode } from "../SplitRandomNode";
import { SplitResultNode } from "../SplitResultNode";
import { SynchronizeNode } from "../SynchronizeNode";
import { HeaderSidebar } from "./HeaderSidebar";

export type NodesSidebarProps = {};

export const NodesSidebar = ({}: NodesSidebarProps) => {
  const { t } = useTranslations(translations);
  const onDragStart = <T,>(
    event: DragEvent<HTMLDivElement>,
    type: IFlowNode["type"],
    data: T
  ) => {
    event.dataTransfer.setData(
      "application/bits-node",
      JSON.stringify({ type, data })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <HeaderSidebar header={t("nodes")}>
      <AutoGrid gap="standard">
        <Heading as="h2" fontSize="standard">
          {t("task")}
        </Heading>
        <Box
          onDragStart={(e) =>
            onDragStart<ITaskChoice>(e, "task", {
              subtype: "choice",
              name: t("new-node-title", { type: t("task-choice") }),
              description: "",
              view: {
                choices: [
                  {
                    markdown: "",
                  },
                ],
                instruction: "",
                variant: "single",
              },
              evaluation: {
                correct: [],
                enableRetry: false,
                showFeedback: false,
                mode: "auto",
              },
              feedback: {
                choices: {},
                patterns: {},
              },
            } as ITaskChoice)
          }
          draggable
        >
          <BitNode
            type="task"
            hideHandles
            maxWidth="100%"
            data={{
              name: t("task-choice"),
              subtype: "choice",
            }}
          />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<ITaskInput>(e, "task", {
              subtype: "input",
              name: t("new-node-title", { type: t("task-input") }),
              description: "",
              view: {
                instruction: "",
              },
              evaluation: {
                pattern: "",
                enableRetry: false,
                showFeedback: false,
                mode: "auto",
              },
              feedback: {
                patterns: [],
              },
            } as ITaskInput)
          }
          draggable
        >
          <BitNode
            type="task"
            hideHandles
            maxWidth="100%"
            data={{
              name: t("task-input"),
              subtype: "input",
            }}
          />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<ITaskFillInTheBlank>(e, "task", {
              subtype: "fill-in-the-blank",
              name: t("new-node-title", { type: t("task-fill-in-the-blank") }),
              description: "",
              view: {
                instruction: "",
                textWithBlanks: "",
              },
              evaluation: {
                blanks: {},
                enableRetry: false,
                showFeedback: false,
                mode: "auto",
              },
              feedback: {
                blanks: {},
              },
            })
          }
          draggable
        >
          <BitNode
            type="task"
            hideHandles
            maxWidth="100%"
            data={{
              name: t("task-fill-in-the-blank"),
              subtype: "fill-in-the-blank",
            }}
          />
        </Box>
        <Heading as="h2" fontSize="standard">
          {t("title")}
        </Heading>
        <Box
          onDragStart={(e) =>
            onDragStart<ITitleSimple>(e, "title", {
              subtype: "simple",
              name: t("new-node-title", { type: t("title-simple") }),
              description: "",
              view: {
                title: "",
                message: "",
              },
            })
          }
          draggable
        >
          <BitNode
            type="title"
            hideHandles
            maxWidth="100%"
            data={{
              name: t("title-simple"),
              subtype: "simple",
            }}
          />
        </Box>
        <Heading as="h2" fontSize="standard">
          {t("input")}
        </Heading>
        <Box
          onDragStart={(e) =>
            onDragStart<IInputMarkdown>(e, "input", {
              subtype: "markdown",
              name: t("new-node-title", { type: t("input-markdown") }),
              description: "",
              view: {
                markdown: "",
              },
            })
          }
          draggable
        >
          <BitNode
            type="input"
            hideHandles
            maxWidth="100%"
            data={{
              name: t("input-markdown"),
              subtype: "markdown",
            }}
          />
        </Box>
        <Heading as="h2" fontSize="standard">
          {t("control")}
        </Heading>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "checkpoint", null)}
          draggable
        >
          <CheckpointNode maxWidth="100%" type="checkpoint" hideHandles />
        </Box>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "synchronize", null)}
          draggable
        >
          <SynchronizeNode maxWidth="100%" type="synchronize" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<ISplitAnswer>(e, "split-answer", {
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
          <SplitAnswerNode maxWidth="100%" type="split-answer" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<ISplitPoints>(e, "split-points", {
              points: 1,
            })
          }
          draggable
        >
          <SplitPointsNode maxWidth="100%" type="split-points" hideHandles />
        </Box>
        <Box
          onDragStart={(e) => onDragStart<null>(e, "split-random", null)}
          draggable
        >
          <SplitRandomNode maxWidth="100%" type="split-random" hideHandles />
        </Box>
        <Box
          onDragStart={(e) =>
            onDragStart<ISplitResult>(e, "split-result", {
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
          <SplitResultNode maxWidth="100%" type="split-result" hideHandles />
        </Box>
      </AutoGrid>
    </HeaderSidebar>
  );
};
