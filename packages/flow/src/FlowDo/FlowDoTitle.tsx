import { titleBits } from "@bitflow/bits";
import { TitleShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import { FlowDoX } from ".";
import translations from "../locales.vocab";

export const FlowDoTitle = ({
  onNext,
  node,
  onClose,
  onPrevious,
  progress,
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious" | "progress"> & {
  node: { type: "title" };
}) => {
  const { t } = useTranslations(translations);
  const titleBit = titleBits[node.data.subtype];
  return (
    <TitleShell<any>
      TitleComponent={titleBit.Title}
      title={node.data}
      progress={{
        max: progress.estimatedNodes,
        value: progress.currentNodeIndex,
      }}
      header={t("title")}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
