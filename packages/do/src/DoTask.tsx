import { FlowTaskNode, FlowTaskPublicNode } from "@bitflow/core";
import { useBitTask } from "@bitflow/provider";
import { TaskShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import { useEffect, useState } from "react";
import translations from "./locales.vocab";
import { DoConfig, DoPropsBase } from "./types";

export const DoTask = ({
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
  DoPropsBase,
  | "onNext"
  | "onClose"
  | "onRetry"
  | "onPrevious"
  | "evaluate"
  | "onSkip"
  | "onAction"
  | "progress"
  | "getConfig"
> & {
  node: FlowTaskNode | FlowTaskPublicNode;
}) => {
  const { t } = useTranslations(translations);
  const [config, setConfig] = useState<DoConfig>({
    enableConfidence: false,
    enableReasoning: false,
  });

  useEffect(() => {
    getConfig()
      .then((c) => setConfig(c))
      .catch(() => {});
  }, [getConfig]);

  const taskBit = useBitTask<
    Bitflow.Task,
    Bitflow.TaskAnswer,
    Bitflow.TaskResult,
    Bitflow.TaskStatistic
  >(node.data.subtype);
  if (!taskBit) {
    throw new Error(
      "task subtype not supported. Please check your provider config."
    );
  }
  return (
    <TaskShell
      mode="default"
      onSkip={onSkip}
      onAction={onAction}
      progress={{
        max: progress.progress,
        value: 100,
      }}
      TaskComponent={taskBit.Task}
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
