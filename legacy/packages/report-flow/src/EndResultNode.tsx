import { DoTry, FlowEndNode } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { StatusFooter } from "./StatusFooter";

export type EndResultNodeProps = {
  type: "end";
  data: FlowEndNode["data"] & {
    result: {
      status: Record<DoTry["status"], number>;
      count: number;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const EndResultNode = ({ data }: EndResultNodeProps) => {
  const { t } = useTranslations(translations);
  const status = data.result.status;
  return (
    <FlowNode
      tone="red"
      title={t("end")}
      description={t("end-helper-text")}
      footerCenter={<StatusFooter status={status} />}
      targetHandles={1}
    />
  );
};
