import { taskBits } from "@bitflow/bits";
import { TaskShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import { useEffect, useState } from "react";
import { FlowDoConfig, FlowDoX } from ".";
import translations from "../locales.vocab";

export const FlowDoTask = ({
  onNext,
  node,
  onClose,
  onPrevious,
  onSkip,
  onAction,
  onRetry,
  progress,
  getConfig,
  evaluate,
}: Pick<
  FlowDoX,
  | "onNext"
  | "node"
  | "onClose"
  | "onRetry"
  | "onPrevious"
  | "evaluate"
  | "onSkip"
  | "onAction"
  | "progress"
  | "getConfig"
> & {
  node: { type: "task" };
}) => {
  const { t } = useTranslations(translations);
  const [config, setConfig] = useState<FlowDoConfig>({
    enableConfidence: false,
    enableReasoning: false,
  });

  useEffect(() => {
    getConfig()
      .then((c) => setConfig(c))
      .catch(() => {});
  }, [getConfig]);

  const taskBit = taskBits[node.data.subtype];
  return (
    <TaskShell<any, any, any, any>
      mode="default"
      onSkip={onSkip}
      onAction={onAction}
      progress={{
        max: progress.estimatedNodes,
        value: progress.currentNodeIndex,
      }}
      TaskComponent={taskBit.Task as any}
      header={t("task")}
      soundUrls={config.soundUrls}
      evaluate={evaluate}
      task={node.data}
      enableConfidence={config.enableConfidence}
      enableReasoning={config.enableReasoning}
      onNext={onNext}
      onRetry={onRetry}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
