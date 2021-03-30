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
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious"> & {
  node: { type: "title" };
}) => {
  const { t } = useTranslations(translations);
  const titleBit = titleBits[node.data.subtype];
  return (
    <TitleShell<any>
      TitleComponent={titleBit.Title}
      title={node.data}
      header={t("title")}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
