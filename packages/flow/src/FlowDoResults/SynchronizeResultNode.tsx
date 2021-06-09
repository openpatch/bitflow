import { useTranslations } from "@vocab/react";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import translations from "../locales.vocab";
import { IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type SynchronizeResultNodeProps = IFlowNode & {
  type: "synchronize";
  data: {
    state: "locked" | "unlocked";
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
      avgTime: number;
      avgTries: number;
    };
  };
};

export const SynchronizeResultNode = ({ data }: SynchronizeResultNodeProps) => {
  const { t } = useTranslations(translations);
  const status = data.result.status;
  return (
    <FlowNode
      tone={data.state === "locked" ? "purple" : "mint"}
      title={t("synchronize")}
      description={t("synchronize-helper-text")}
      footerRight={data.state === "locked" ? "locked" : "unlocked"}
      footerCenter={<StatusFooter status={status} />}
      sourceHandles={1}
      targetHandles={1}
    />
  );
};
