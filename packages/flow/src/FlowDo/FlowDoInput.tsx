import { inputBits } from "@bitflow/bits";
import { InputShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import { FlowDoX } from ".";
import translations from "../locales.vocab";

export const FlowDoInput = ({
  onNext,
  node,
  onClose,
  onPrevious,
  progress,
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious" | "progress"> & {
  node: { type: "input" };
}) => {
  const { t } = useTranslations(translations);
  const inputBit = inputBits[node.data.subtype];
  return (
    <InputShell<any>
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
