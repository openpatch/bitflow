import { TaskResult } from "@bitflow/base";
import { TaskBitsSchema } from "@bitflow/bits";
import * as z from "zod";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode, FlowNodeProps } from "../FlowNode";
import { IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type TaskResultNodeProps = IFlowNode & {
  type: "task";
  data: z.infer<typeof TaskBitsSchema> & {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
      states: Record<TaskResult["state"], number>;
      difficulty: number;
      discriminationIndex: number;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const TaskResultNode = ({ type, data }: TaskResultNodeProps) => {
  const status = data.result.status;

  let tone: FlowNodeProps["tone"] = "red";
  let title = data.name;
  const difficulty = Math.round(data.result.difficulty * 10000) / 100;
  if (Number.isNaN(difficulty)) {
    tone = "blue";
  }
  if (difficulty > 80) {
    tone = "green";
  } else if (difficulty > 60) {
    tone = "mint";
  } else if (difficulty > 30) {
    tone = "yellow";
  } else {
    tone = "red";
  }
  if (!Number.isNaN(difficulty)) {
    title += ` (${difficulty}%)`;
  }

  return (
    <FlowNode
      tone={tone}
      title={title}
      description={data.description}
      footerLeft={type}
      footerRight={data.subtype}
      footerCenter={<StatusFooter status={status} />}
      targetHandles={1}
      sourceHandles={1}
    />
  );
};
