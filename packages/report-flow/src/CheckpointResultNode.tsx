import { DoTry } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { StatusFooter } from "./StatusFooter";

export type CheckpointResultNodeProps = {
  type: "checkpoint";
  data: {
    result: {
      status: Record<DoTry["status"], number>;
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
