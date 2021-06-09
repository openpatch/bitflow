import { useTranslations } from "@vocab/react";
import * as z from "zod";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import translations from "../locales.vocab";
import { IFlowNode, StartSchema } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type StartResultNodeProps = IFlowNode & {
  type: "start";
  data: z.infer<typeof StartSchema> & {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
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
