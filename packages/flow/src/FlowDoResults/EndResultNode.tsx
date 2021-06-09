import { useTranslations } from "@vocab/react";
import * as z from "zod";
import { FlowDoResultPathEntry } from "../FlowDo";
import { FlowNode } from "../FlowNode";
import translations from "../locales.vocab";
import { EndSchema, IFlowNode } from "../schemas";
import { StatusFooter } from "./StatusFooter";

export type EndResultNodeProps = IFlowNode & {
  type: "end";
  data: z.infer<typeof EndSchema> & {
    result: {
      status: Record<FlowDoResultPathEntry["status"], number>;
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
