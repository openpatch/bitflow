import { DoTry, FlowTaskNode } from "@bitflow/core";
import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { StatusFooter } from "./StatusFooter";

export type TaskResultNodeProps = {
  type: "task";
  data: FlowTaskNode["data"] & {
    result: {
      status: Record<DoTry["status"], number>;
      states: Record<Bitflow.TaskResult["state"], number>;
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
  if (Number.isNaN(difficulty) || data.evaluation?.mode === "skip") {
    tone = "blue";
  } else if (difficulty > 80) {
    tone = "green";
  } else if (difficulty > 60) {
    tone = "mint";
  } else if (difficulty > 30) {
    tone = "yellow";
  } else {
    tone = "red";
  }
  if (!Number.isNaN(difficulty) && data.evaluation?.mode !== "skip") {
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
