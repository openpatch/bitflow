import { useTranslations } from "@vocab/react";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import translations from "../locales.vocab";
import { IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type CheckpointResultNodeProps = IFlowNode & {
  type: "checkpoint";
  data: {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
      count: number;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const CheckpointResultNode = ({ data }: CheckpointResultNodeProps) => {
  const { t } = useTranslations(translations);
  const status = data.result.status;
  return (
    <FlowNode
      tone="purple"
      title={t("checkpoint")}
      description={t("checkpoint-helper-text")}
      footerCenter={<StatusFooter status={status} />}
      sourceHandles={1}
      targetHandles={1}
    />
  );
};
