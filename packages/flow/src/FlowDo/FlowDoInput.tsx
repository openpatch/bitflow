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
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious"> & {
  node: { type: "input" };
}) => {
  const { t } = useTranslations(translations);
  const inputBit = inputBits[node.data.subtype];
  return (
    <InputShell<any>
      InputComponent={inputBit.Input}
      header={t("input")}
      input={node.data}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
