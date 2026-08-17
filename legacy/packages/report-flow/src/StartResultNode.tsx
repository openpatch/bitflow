import { DoTry, FlowStartNode } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { StatusFooter } from "./StatusFooter";

export type StartResultNodeProps = {
  type: "start";
  data: FlowStartNode["data"] & {
    result: {
      status: Record<DoTry["status"], number>;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const StartResultNode = ({ data }: StartResultNodeProps) => {
  const { t } = useTranslations(translations);
  const status = data.result.status;
  return (
    <FlowNode
      tone="teal"
      title={t("start")}
      description={t("start-helper-text")}
      footerCenter={<StatusFooter status={status} />}
      sourceHandles={1}
    />
  );
};
