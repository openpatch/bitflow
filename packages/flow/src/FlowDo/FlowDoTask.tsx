import { taskBits } from "@bitflow/bits";
import { TaskShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import { useEffect, useState } from "react";
import { FlowConfig, FlowDoX } from ".";
import translations from "../locales.vocab";

export const FlowDoTask = ({
  onNext,
  node,
  onClose,
  onPrevious,
  onSkip,
  onAction,
  getConfig,
  evaluate,
}: Pick<
  FlowDoX,
  | "onNext"
  | "node"
  | "onClose"
  | "onPrevious"
  | "evaluate"
  | "onSkip"
  | "onAction"
  | "getConfig"
> & {
  node: { type: "task" };
}) => {
  const { t } = useTranslations(translations);
  const [config, setConfig] = useState<FlowConfig>({
    enableConfidence: false,
    enableReasoning: false,
  });

  useEffect(() => {
    getConfig().then((c) => setConfig(c));
  }, [getConfig]);
  const taskBit = taskBits[node.data.subtype];
  return (
    <TaskShell<any, any, any, any>
      mode="default"
      onSkip={onSkip}
      onAction={onAction}
      TaskComponent={taskBit.Task as any}
      header={t("task")}
      soundUrls={config.soundUrls}
      evaluate={evaluate}
      task={node.data}
      enableConfidence={config.enableConfidence}
      enableReasoning={config.enableReasoning}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
