import { FlowInputNode, FlowInputPublicNode } from "@bitflow/core";
import { useBitInput } from "@bitflow/provider";
import { InputShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { DoPropsBase } from "./types";

export const DoInput = ({
  onNext,
  node,
  onClose,
  onPrevious,
  progress,
}: Pick<
  DoPropsBase,
  "onNext" | "node" | "onClose" | "onPrevious" | "progress"
> & {
  node: FlowInputNode | FlowInputPublicNode;
}) => {
  const { t } = useTranslations(translations);
  const inputBit = useBitInput(node.data.subtype);
  if (!inputBit) {
    throw new Error(
      "input subtype not supported. Please check your provider config."
    );
  }
  return (
    <InputShell
      InputComponent={inputBit.Input}
      progress={{
        value: progress.currentNodeIndex,
        max: progress.estimatedNodes,
      }}
      header={t("input")}
      input={node.data}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
