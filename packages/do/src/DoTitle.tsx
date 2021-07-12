import { FlowTitleNode, FlowTitlePublicNode } from "@bitflow/core";
import { useBitTitle } from "@bitflow/provider";
import { TitleShell } from "@bitflow/shell";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { DoPropsBase } from "./types";

export const DoTitle = ({
  onNext,
  node,
  onClose,
  onPrevious,
  progress,
}: Pick<
  DoPropsBase,
  "onNext" | "node" | "onClose" | "onPrevious" | "progress"
> & {
  node: FlowTitleNode | FlowTitlePublicNode;
}) => {
  const { t } = useTranslations(translations);
  const titleBit = useBitTitle(node.data.subtype);
  if (!titleBit) {
    throw new Error(
      "title subtype not supported. Please check your provider config."
    );
  }
  return (
    <TitleShell
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
