import { DoTry } from "@bitflow/core";
import { FlowNode } from "@bitflow/flow-node";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { StatusFooter } from "./StatusFooter";

export type SynchronizeResultNodeProps = {
  type: "synchronize";
  data: {
    state: "locked" | "unlocked";
    result: {
      status: Record<DoTry["status"], number>;
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
